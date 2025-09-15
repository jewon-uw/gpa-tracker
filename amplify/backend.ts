// amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

export const backend = defineBackend({ auth, data });

// Reach the L1 CloudFormation resource for the User Pool:
const { cfnUserPool } = backend.auth.resources.cfnResources;

// Override the password policy (no uppercase, keep length 8, turn off others as you like)
cfnUserPool.addPropertyOverride('Policies.PasswordPolicy', {
  MinimumLength: 8,
  RequireLowercase: true,
  RequireUppercase: false, // <-- relax this
  RequireNumbers: false,
  RequireSymbols: false,
  TemporaryPasswordValidityDays: 3,
});
