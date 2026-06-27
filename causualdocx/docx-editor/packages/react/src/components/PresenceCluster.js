import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { AvatarStack, Badge, Button } from '@schnsrw/design-system';
const STATUS = {
    connected: { tone: 'success', label: 'Live' },
    connecting: { tone: 'warning', label: 'Connecting…' },
    disconnected: { tone: 'neutral', label: 'Offline' },
};
const wrapStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-4, 8px)',
};
const dividerStyle = {
    width: 1,
    alignSelf: 'stretch',
    minHeight: 20,
    background: 'var(--color-divider)',
    margin: '0 var(--space-1, 2px)',
};
export function PresenceCluster({ peers, status, onShare, maxAvatars = 4, }) {
    const hasPeers = peers.length > 0;
    if (!hasPeers && !status && !onShare)
        return null;
    const s = status ? STATUS[status] : null;
    return (_jsxs("div", { style: wrapStyle, "data-testid": "presence-cluster", children: [hasPeers && (_jsx(AvatarStack, { size: 26, max: maxAvatars, people: peers.map((p) => {
                    var _a;
                    return ({
                        name: p.name,
                        color: p.color,
                        active: (_a = p.active) !== null && _a !== void 0 ? _a : true,
                    });
                }) })), s && (_jsx(Badge, { tone: s.tone, dot: true, children: s.label })), onShare && (_jsxs(_Fragment, { children: [_jsx("span", { style: dividerStyle, "aria-hidden": "true" }), _jsx(Button, { variant: "secondary", size: "sm", icon: "share", onClick: onShare, children: "Share" })] }))] }));
}
export default PresenceCluster;
//# sourceMappingURL=PresenceCluster.js.map