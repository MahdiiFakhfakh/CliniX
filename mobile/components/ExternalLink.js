import { Link } from 'expo-router';
import React from 'react';
import { Linking } from 'react-native';

export function ExternalLink(props) {
    return (<Link target="_blank" {...props} href={props.href} onPress={async (e) => {
            e.preventDefault();
            if (typeof props.href === 'string') {
                await Linking.openURL(props.href);
            }
        }}/>);
}
