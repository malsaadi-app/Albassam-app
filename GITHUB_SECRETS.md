# GitHub Secrets for iOS Build

## Secrets to Add

Add these secrets to GitHub repository: `malsaadi-app/Albassam-app`

Go to: https://github.com/malsaadi-app/Albassam-app/settings/secrets/actions

### 1. APPLE_CERTIFICATE_P12

**Value:** (Base64 encoded P12 file)

```
See: ios-certificates/distribution.p12.base64
```

Copy the entire content of `distribution.p12.base64` file.

### 2. APPLE_CERTIFICATE_PASSWORD

**Value:**
```
albassam2026
```

### 3. APPLE_TEAM_ID

**Value:**
```
8JQBAUT226
```

## How to Add Secrets

1. Go to: https://github.com/malsaadi-app/Albassam-app/settings/secrets/actions
2. Click: **"New repository secret"**
3. Name: Enter secret name (e.g., APPLE_CERTIFICATE_P12)
4. Value: Paste the value
5. Click: **"Add secret"**
6. Repeat for all 3 secrets

## Verification

After adding all secrets, you should see:
- ✅ APPLE_CERTIFICATE_P12
- ✅ APPLE_CERTIFICATE_PASSWORD
- ✅ APPLE_TEAM_ID

## Next Steps

After secrets are added:
1. Create App ID in Apple Developer
2. Create Provisioning Profile
3. Add Provisioning Profile to GitHub Secrets
4. Trigger iOS build workflow
