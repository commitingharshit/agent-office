import { jsx as _jsx } from "react/jsx-runtime";
import { RightDockPanel } from '../RightDockPanel';
import { MaterialSymbol } from '../ui/Icons';
import { PanelState } from '../ui/PanelState';
export function PropertiesPanel({ kind, onClose, children }) {
    return (_jsx(RightDockPanel, { title: "Format", icon: _jsx(MaterialSymbol, { name: "tune", size: 18 }), testId: "properties-panel", ariaLabel: "Format properties", onClose: onClose, children: kind && children ? (children) : (_jsx(PanelState, { kind: "empty", message: "Select an image, table, or shape to edit its properties." })) }));
}
//# sourceMappingURL=PropertiesPanel.js.map