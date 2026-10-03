import SwiftUI
import PencilKit

#if os(iOS)
struct InkCanvasView: UIViewRepresentable {
    @Binding var data: Data

    final class Coordinator: NSObject, PKCanvasViewDelegate {
        var parent: InkCanvasView

        init(parent: InkCanvasView) {
            self.parent = parent
        }

        func canvasViewDrawingDidChange(_ canvasView: PKCanvasView) {
            parent.data = canvasView.drawing.dataRepresentation()
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeUIView(context: Context) -> PKCanvasView {
        let canvas = PKCanvasView()
        canvas.delegate = context.coordinator
        canvas.drawingPolicy = .anyInput
        if let drawing = try? PKDrawing(data: data) {
            canvas.drawing = drawing
        }

        let picker = PKToolPicker()
        picker.setVisible(true, forFirstResponder: canvas)
        picker.addObserver(canvas)
        canvas.becomeFirstResponder()
        return canvas
    }

    func updateUIView(_ canvas: PKCanvasView, context: Context) {
        guard let drawing = try? PKDrawing(data: data), drawing != canvas.drawing else { return }
        canvas.drawing = drawing
    }
}
#elseif os(macOS)
struct InkCanvasView: NSViewRepresentable {
    @Binding var data: Data

    final class Coordinator: NSObject, PKCanvasViewDelegate {
        var parent: InkCanvasView

        init(parent: InkCanvasView) {
            self.parent = parent
        }

        func canvasViewDrawingDidChange(_ canvasView: PKCanvasView) {
            parent.data = canvasView.drawing.dataRepresentation()
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeNSView(context: Context) -> PKCanvasView {
        let canvas = PKCanvasView()
        canvas.delegate = context.coordinator
        if let drawing = try? PKDrawing(data: data) {
            canvas.drawing = drawing
        }
        return canvas
    }

    func updateNSView(_ canvas: PKCanvasView, context: Context) {
        guard let drawing = try? PKDrawing(data: data), drawing != canvas.drawing else { return }
        canvas.drawing = drawing
    }
}
#endif
