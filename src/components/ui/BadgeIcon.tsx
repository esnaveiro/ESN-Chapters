import {
    Award,
    BookOpen,
    Camera,
    Crown,
    Flag,
    Globe,
    GraduationCap,
    HandshakeIcon,
    Heart,
    Landmark,
    Medal,
    Mic,
    Plane,
    Shield,
    Star,
    Trophy,
    Users,
    Zap,
} from "lucide-react";

export const BADGE_ICONS = {
    star: Star,
    trophy: Trophy,
    award: Award,
    users: Users,
    heart: Heart,
    landmark: Landmark,
    plane: Plane,
    globe: Globe,
    zap: Zap,
    shield: Shield,
    crown: Crown,
    flag: Flag,
    camera: Camera,
    medal: Medal,
    handshake: HandshakeIcon,
    "graduation-cap": GraduationCap,
    book: BookOpen,
    mic: Mic,
} as const;

export type BadgeIconName = keyof typeof BADGE_ICONS;

export function BadgeIcon({
                              name,
                              size = 14,
                              className,
                              style,
                          }: {
    name: string | null | undefined;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}) {
    if (!name || !(name in BADGE_ICONS)) return null;
    const Icon = BADGE_ICONS[name as BadgeIconName];
    return <Icon size={size} className={className} style={style}/>;
}
