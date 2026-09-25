import { StyleSheet, Platform } from 'react-native';

/**
 * EcoShift Design System Tokens
 * Source: Waste Management EcoShift Design System Reference
 */
export const colors = {
    // Primary - Eco Green Palette
    primary800: '#1B5E20',       // Dark pressed state
    primary700: '#236B28',       // Active links & secondary text
    primary600: '#2E7D32',       // MAIN Primary Green (Buttons, Active states)
    primary: '#2E7D32',          // Default alias for primary600
    primary400: '#66BB6A',       // Light green accent
    primary100: '#C8E6C9',       // Soft badge / pill tint
    primary50: '#EDF7EE',        // Screen / section tint background

    // Neutrals - Text & Surfaces
    textPrimary: '#1B1F1C',      // Main headlines & titles
    textSecondary: '#55605A',    // Labels, body copy, descriptions
    placeholder: '#8A948E',      // Placeholder, disabled states
    textMuted: '#8A948E',        // Alias for muted text
    textLink: '#2E7D32',         // Clickable link color

    // Surfaces & Borders
    border: '#DCE3DE',           // Card & input border
    divider: '#DCE3DE',          // Line dividers
    surfaceAlt: '#F1F5F1',       // Alternate card fill
    background: '#EDF7EE',       // Screen background (tint bg)
    backgroundWhite: '#FBFAFB',  // Clean neutral background
    cardBg: '#FFFFFF',           // Crisp white container fill

    // Semantic / Feedback
    success: '#2E7D32',
    error: '#D32F2F',

    // Base
    white: '#FFFFFF',
    black: '#000000',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const radius = {
    xs: 6,
    sm: 10,
    md: 12,
    lg: 14,
    xl: 20,
    full: 9999,
};

export const typography = {
    fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'sans-serif',
    }),
    h1: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: -0.4,
    },
    h2: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: -0.2,
    },
    h3: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
        marginBottom: 6,
    },
    bodyLarge: {
        fontSize: 16,
        fontWeight: '400',
        color: colors.textSecondary,
        lineHeight: 24,
    },
    bodyMedium: {
        fontSize: 14,
        fontWeight: '400',
        color: colors.textSecondary,
        lineHeight: 20,
    },
    caption: {
        fontSize: 12,
        fontWeight: '400',
        color: colors.placeholder,
        lineHeight: 16,
    },
    buttonLarge: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
};

export const globalStyles = StyleSheet.create({
    // Safe Area & Screen Wrappers
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    screenContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.base,
        paddingBottom: spacing.xl,
        justifyContent: 'space-between',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },

    // Header Bar
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        marginTop: spacing.xs,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Typography helpers
    title: {
        ...typography.h1,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.bodyMedium,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },

    // Form Fields
    formGroup: {
        marginBottom: spacing.base,
    },
    label: {
        ...typography.label,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBg,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.base,
        height: 52,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: colors.textPrimary,
        paddingVertical: 0,
    },
    inputRightIcon: {
        paddingLeft: spacing.sm,
    },

    // Primary CTA Button (Figma Spec: 52px height, 12px radius, Poppins Medium 16, Primary/600)
    primaryButton: {
        backgroundColor: colors.primary600,
        height: 52,
        borderRadius: radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.sm,
        shadowColor: colors.primary800,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 2,
    },
    primaryButtonText: {
        ...typography.buttonLarge,
    },

    // Secondary Button (Outline)
    secondaryButton: {
        backgroundColor: 'transparent',
        height: 50,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: colors.primary600,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary700,
    },

    // Pill Button (used in Explore/Welcome Screen)
    pillButton: {
        backgroundColor: colors.cardBg,
        height: 54,
        borderRadius: radius.full,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
        paddingHorizontal: spacing.lg,
    },
    pillButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
        marginLeft: spacing.md,
    },

    // Social Button (Card Style)
    socialButtonCard: {
        backgroundColor: colors.cardBg,
        height: 52,
        borderRadius: radius.md,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },
    socialButtonCardText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },

    // Checkbox (EcoShift Design System: Primary/600 active state)
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
        marginBottom: spacing.base,
    },
    checkboxCircle: {
        width: 22,
        height: 22,
        borderRadius: radius.full,
        borderWidth: 1.5,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm + 2,
        backgroundColor: colors.cardBg,
    },
    checkboxCircleActive: {
        backgroundColor: colors.primary600,
        borderColor: colors.primary600,
    },
    checkboxLabel: {
        fontSize: 13.5,
        color: colors.textSecondary,
        flex: 1,
    },

    // Divider
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.divider,
    },
    dividerText: {
        paddingHorizontal: spacing.md,
        fontSize: 13,
        color: colors.placeholder,
        fontWeight: '500',
    },

    // Footer Links
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    footerText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary600,
        marginLeft: spacing.xs,
    },

    // Welcome Screen Specifics
    welcomeContainer: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        justifyContent: 'space-between',
        paddingVertical: spacing.lg,
    },
    welcomeTopSection: {
        alignItems: 'center',
        marginTop: spacing.xl + spacing.sm,
    },
    welcomeTextContainer: {
        alignItems: 'center',
        marginTop: spacing.lg,
        paddingHorizontal: spacing.base,
    },
    welcomeHeading: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 280,
    },
    welcomeButtonsSection: {
        width: '100%',
        marginVertical: spacing.lg,
    },

    // Login Screen Specifics
    loginTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rememberMeText: {
        fontSize: 13.5,
        color: colors.textSecondary,
    },
    forgotPasswordText: {
        fontSize: 13.5,
        fontWeight: '500',
        color: colors.textSecondary,
    },

    // Password Changed Screen Specifics
    passwordChangedContainer: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    passwordChangedCenterSection: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
    },
    passwordChangedTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.md,
        letterSpacing: -0.5,
    },
    passwordChangedSubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xl,
        maxWidth: 260,
    },
    // Add inside globalStyles = StyleSheet.create({ ... }) in globalStyles.js

    // --- HOME SCREEN STYLES ---
    logoTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.primary, // #2E7D32
        letterSpacing: -0.5,
    },
    logoSub: {
        color: colors.primary400, // #66BB6A
    },
    sectionHeader: {
        fontSize: 26,
        fontWeight: '700',
        color: colors.textPrimary,
        marginVertical: spacing.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBg,
        borderRadius: radius.xl,
        paddingHorizontal: spacing.base,
        height: 52,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    scanCard: {
        backgroundColor: colors.primary50,
        borderRadius: radius.xl,
        paddingVertical: 35,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanButton: {
        backgroundColor: colors.primary600,
        paddingVertical: spacing.base,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.lg,
        width: '100%',
        alignItems: 'center',
    },
    scanButtonText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 17,
    },
    drawerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    drawerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.primary600,
        marginLeft: spacing.md,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.textSecondary,
        marginLeft: spacing.base,
    },

    // --- SCAN SCREEN STYLES ---
    cameraContainer: {
        flex: 1,
        backgroundColor: colors.black,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: colors.background,
    },
    permissionText: {
        ...typography.bodyLarge,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    captureButton: {
        width: 75,
        height: 75,
        borderRadius: radius.full,
        borderWidth: 4,
        borderColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerCaptureCircle: {
        width: 60,
        height: 60,
        borderRadius: radius.full,
        backgroundColor: colors.primary600,
    },
});

export default globalStyles;
