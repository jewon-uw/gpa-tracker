'use client';
import { useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import outputs from '../../amplify_outputs.json';

let configured = false;

export default function AmplifyProvider({ children }: { children: React.ReactNode }) {
    if (!configured) {
        Amplify.configure(outputs);
        configured = true;
    }
    
    useEffect(() => {
        let mounted = true;
        (async () => {
            // dynamic import avoids HMR complaining about JSON modules
            const outputs = (await import('../../amplify_outputs.json')).default as any;
            if (mounted) Amplify.configure(outputs);
        })();
        return () => { mounted = false; };
    }, []);

    return <>{children}</>;
}
