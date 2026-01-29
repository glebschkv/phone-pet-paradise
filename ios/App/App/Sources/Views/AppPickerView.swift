import SwiftUI
import FamilyControls

/// SwiftUI wrapper around Apple's FamilyActivityPicker.
/// Presented modally from the Capacitor plugin when the user taps "Select Apps to Block".
@available(iOS 16.0, *)
struct AppPickerView: View {
    @State var selection: FamilyActivitySelection
    let onDone: (FamilyActivitySelection) -> Void
    let onCancel: () -> Void

    var body: some View {
        NavigationView {
            FamilyActivityPicker(selection: $selection)
                .navigationTitle("Block Apps")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") {
                            onCancel()
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") {
                            onDone(selection)
                        }
                        .fontWeight(.semibold)
                    }
                }
        }
    }
}
