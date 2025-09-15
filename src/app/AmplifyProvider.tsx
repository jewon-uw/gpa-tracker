// src/app/AmplifyProvider.tsx
'use client';
import { useEffect, type PropsWithChildren } from 'react';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';
import '@aws-amplify/ui-react/styles.css';

export default function AmplifyProvider({ children }: PropsWithChildren) {
    // configure once on mount
    useEffect(() => {
        Amplify.configure(outputs);
    }, []);

    return <>{children}</>;
}
