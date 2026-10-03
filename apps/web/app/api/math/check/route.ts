import { NextRequest, NextResponse } from "next/server";
import { parse, simplify } from "mathjs";

type MathCheckRequest = {
  before?: string;
  after?: string;
};

const BUILT_INS = new Set([
  "e", "E", "pi", "PI", "i", "Infinity",
  "sin", "cos", "tan", "asin", "acos", "atan",
  "sqrt", "abs", "log", "ln", "exp", "min", "max"
]);

function residual(input: string) {
  const parts = input.split("=");
  if (parts.length === 2) return `(${parts[0]})-(${parts[1]})`;
  return input;
}

function variableNames(expression: string) {
  const variables = new Set<string>();
  const node = parse(expression);
  node.traverse((child: any) => {
    if (child?.type === "SymbolNode" && !BUILT_INS.has(child.name)) {
      variables.add(child.name);
    }
  });
  return [...variables].sort();
}

function isConstantExpression(expression: string) {
  return variableNames(expression).length === 0;
}

function closeEnough(a: number, b: number) {
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= 1e-8 * scale;
}

function deterministicScope(names: string[], index: number) {
  const candidates = [-3, -2, -1, 0.5, 1, 2, 3, 4];
  const scope: Record<string, number> = {};
  names.forEach((name, offset) => {
    scope[name] = candidates[(index + offset * 2) % candidates.length];
  });
  return scope;
}

export async function POST(request: NextRequest) {
  let body: MathCheckRequest;
  try {
    body = (await request.json()) as MathCheckRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const before = body.before?.trim() || "";
  const after = body.after?.trim() || "";

  if (!before || !after) {
    return NextResponse.json({ error: "Both math steps are required." }, { status: 400 });
  }
  if (before.length > 300 || after.length > 300) {
    return NextResponse.json({ error: "Math steps are too long for this checker." }, { status: 400 });
  }

  try {
    const beforeEquation = before.includes("=");
    const afterEquation = after.includes("=");

    if (beforeEquation !== afterEquation) {
      return NextResponse.json({
        equivalent: false,
        confidence: "high",
        reason: "One step is an equation while the other is an expression."
      });
    }

    if (!beforeEquation) {
      const symbolic = simplify(`(${before})-(${after})`).toString();
      if (symbolic === "0") {
        return NextResponse.json({
          equivalent: true,
          confidence: "high",
          reason: "The expressions simplify to the same value."
        });
      }

      const names = [...new Set([...variableNames(before), ...variableNames(after)])];
      const a = parse(before).compile();
      const b = parse(after).compile();
      let checked = 0;

      for (let index = 0; index < 8; index++) {
        const scope = deterministicScope(names, index);
        const av = Number(a.evaluate(scope));
        const bv = Number(b.evaluate(scope));
        if (!Number.isFinite(av) || !Number.isFinite(bv)) continue;
        checked++;
        if (!closeEnough(av, bv)) {
          return NextResponse.json({
            equivalent: false,
            confidence: checked >= 3 ? "high" : "medium",
            reason: "The two expressions produce different values."
          });
        }
      }

      return NextResponse.json({
        equivalent: checked >= 3,
        confidence: checked >= 5 ? "high" : "medium",
        reason: checked >= 3
          ? "The expressions agree across symbolic/numeric checks."
          : "There were not enough valid sample points to verify this step."
      });
    }

    const first = residual(before);
    const second = residual(after);

    try {
      const ratio = simplify(`(${first})/(${second})`).toString();
      if (isConstantExpression(ratio)) {
        const value = Number(parse(ratio).compile().evaluate({}));
        if (Number.isFinite(value) && Math.abs(value) > 1e-12) {
          return NextResponse.json({
            equivalent: true,
            confidence: "high",
            reason: "Both equations have proportional residuals, so they describe the same solution set."
          });
        }
      }
    } catch {
      // Fall back to deterministic numeric proportionality.
    }

    const names = [...new Set([...variableNames(first), ...variableNames(second)])];
    const firstCompiled = parse(first).compile();
    const secondCompiled = parse(second).compile();
    const ratios: number[] = [];

    for (let index = 0; index < 10; index++) {
      const scope = deterministicScope(names, index);
      const a = Number(firstCompiled.evaluate(scope));
      const b = Number(secondCompiled.evaluate(scope));
      if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(b) < 1e-9) continue;
      ratios.push(a / b);
    }

    if (ratios.length >= 4) {
      const baseline = ratios[0];
      const proportional = ratios.every((value) => closeEnough(value, baseline));
      if (proportional && Math.abs(baseline) > 1e-12) {
        return NextResponse.json({
          equivalent: true,
          confidence: "medium",
          reason: "The equations are numerically proportional across several test values."
        });
      }
    }

    return NextResponse.json({
      equivalent: false,
      confidence: "medium",
      reason: "The checker could not verify that the second line is equivalent to the first."
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error
          ? `Could not parse this math: ${error.message}`
          : "Could not parse this math."
      },
      { status: 400 }
    );
  }
}
