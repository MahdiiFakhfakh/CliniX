export const palette = {
    primary: {
        700: '#0F766E',
        600: '#059669',
        500: '#14B8A6',
        100: '#CCFBF1',
        50: '#F0FDFA',
    },
    secondary: {
        mint500: '#10B981',
        mint100: '#D1FAE5',
        ink: '#0F172A',
        soft: '#64748B',
    },
    accent: {
        amber: '#F4BE3A',
        coral: '#F3716B',
        violet: '#0284C7',
    },
    functional: {
        success: '#10B981',
        warning: '#F4BE3A',
        error: '#F26D6D',
        info: '#0284C7',
        disabled: '#C7CFDB',
    },
    backgrounds: {
        app: '#F8FAFC',
        surface: '#FFFFFF',
        surfaceTint: '#F0FDFA',
        inverse: '#0F172A',
        headerGradientStart: '#0F766E',
        headerGradientEnd: '#059669',
    },
    chart: {
        axis: '#8D97A8',
        good: '#10B981',
        moderate: '#F4BE3A',
        high: '#F3716B',
        hazardous: '#0284C7',
    },
};

export const colors = {
    background: palette.backgrounds.app,
    surface: palette.backgrounds.surface,
    surfaceTint: palette.backgrounds.surfaceTint,
    inverse: palette.backgrounds.inverse,
    primary: palette.primary[700],
    primarySoft: palette.primary[100],
    primaryMid: palette.primary[600],
    primaryLight: palette.primary[500],
    text: palette.secondary.ink,
    textMuted: palette.secondary.soft,
    textSubtle: '#94A3B8',
    border: '#DDEAE7',
    success: palette.functional.success,
    successSoft: '#D1FAE5',
    successBorder: '#A7F3D0',
    warning: palette.functional.warning,
    warningSoft: '#FFF4DD',
    warningText: '#8A6100',
    danger: palette.functional.error,
    dangerSoft: '#FFF0F0',
    dangerBorder: '#F1BEBE',
    info: palette.functional.info,
    infoSoft: '#E0F2FE',
    infoBorder: '#BAE6FD',
    disabled: palette.functional.disabled,
    offlineBanner: '#FFF6E7',
    headerGradientStart: palette.backgrounds.headerGradientStart,
    headerGradientEnd: palette.backgrounds.headerGradientEnd,
    navActiveBg: palette.primary[100],
    navInactive: palette.secondary.soft,
};

export const spacing = {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
};

export const radius = {
    sm: 12,
    md: 16,
    lg: 24,
    xl: 28,
    full: 999,
};

export const fonts = {
    displayRegular: 'Sora_400Regular',
    displayMedium: 'Sora_500Medium',
    displaySemiBold: 'Sora_600SemiBold',
    displayBold: 'Sora_700Bold',
    bodyRegular: 'Manrope_400Regular',
    bodyMedium: 'Manrope_500Medium',
    bodySemiBold: 'Manrope_600SemiBold',
    bodyBold: 'Manrope_700Bold',
};

export const fontWeights = {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
};

export const typography = {
    display: 40,
    h1: 32,
    h2: 24,
    h3: 20,
    title: 24,
    heading: 20,
    body: 14,
    caption: 12,
    button: 16,
    bodyLarge: 16,
    bodySmall: 13,
    overline: 11,
};

export const textStyles = {
    display: {
        fontFamily: fonts.displayBold,
        fontSize: typography.display,
        lineHeight: 44,
    },
    h1: {
        fontFamily: fonts.bodyBold,
        fontSize: typography.h1,
        lineHeight: 38,
    },
    h2: {
        fontFamily: fonts.bodySemiBold,
        fontSize: typography.h2,
        lineHeight: 30,
    },
    h3: {
        fontFamily: fonts.bodySemiBold,
        fontSize: typography.h3,
        lineHeight: 26,
    },
    title: {
        fontFamily: fonts.bodySemiBold,
        fontSize: typography.title,
        lineHeight: 30,
    },
    heading: {
        fontFamily: fonts.bodySemiBold,
        fontSize: typography.heading,
        lineHeight: 26,
    },
    bodyLarge: {
        fontFamily: fonts.bodyMedium,
        fontSize: typography.bodyLarge,
        lineHeight: 24,
    },
    bodyMedium: {
        fontFamily: fonts.bodyMedium,
        fontSize: typography.body,
        lineHeight: 22,
    },
    bodySemiBold: {
        fontFamily: fonts.bodySemiBold,
        fontSize: typography.body,
        lineHeight: 22,
    },
    body: {
        fontFamily: fonts.bodyRegular,
        fontSize: typography.body,
        lineHeight: 22,
    },
    bodySmall: {
        fontFamily: fonts.bodyRegular,
        fontSize: typography.bodySmall,
        lineHeight: 20,
    },
    caption: {
        fontFamily: fonts.bodyMedium,
        fontSize: typography.caption,
        lineHeight: 16,
    },
    overline: {
        fontFamily: fonts.bodySemiBold,
        fontSize: typography.overline,
        lineHeight: 14,
        letterSpacing: 0.4,
    },
    metric: {
        fontFamily: fonts.displayMedium,
        fontSize: 48,
        lineHeight: 52,
    },
    metricUnit: {
        fontFamily: fonts.bodyMedium,
        fontSize: 20,
        lineHeight: 24,
    },
};

export const shadows = {
    card: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
    },
    floating: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 6,
    },
};

export const components = {
    button: {
        heights: {
            small: 36,
            medium: 44,
            large: 52,
        },
        radius: 14,
        focusRingColor: 'rgba(20, 184, 166, 0.3)',
    },
    tabBar: {
        height: 72,
        radius: 28,
        iconSize: 22,
        activeItemSize: 40,
    },
    statusPill: {
        radius: 24,
    },
};
