import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/src/core/theme/tokens';
import AppIcon from '@/src/shared/components/AppIcon';

const sizeConfig = {
    sm: { box: 36, radius: 10, icon: 21 },
    md: { box: 48, radius: 12, icon: 28 },
    lg: { box: 70, radius: 18, icon: 38 },
    xl: { box: 96, radius: 24, icon: 52 },
};

export function ClinixLogo({ size = 'md', style }) {
    const config = sizeConfig[size] ?? sizeConfig.md;

    return (
        <View
            style={[
                styles.logo,
                {
                    width: config.box,
                    height: config.box,
                    borderRadius: config.radius,
                },
                style,
            ]}
        >
            <AppIcon color="#FFFFFF" name="heart" size={config.icon} />
        </View>
    );
}

const styles = StyleSheet.create({
    logo: {
        alignItems: 'center',
        backgroundColor: colors.primary,
        justifyContent: 'center',
        shadowColor: '#134E4A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 5,
    },
});
