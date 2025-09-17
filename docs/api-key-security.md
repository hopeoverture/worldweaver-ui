# API Key Security Guide

## 🔒 Preventing API Key Issues

### 1. Regular Health Checks
```bash
# Run weekly to monitor API health
npm run check-api-health
```

### 2. OpenAI Account Monitoring
- **Usage Dashboard**: https://platform.openai.com/account/usage
- **Billing**: https://platform.openai.com/account/billing
- **API Keys**: https://platform.openai.com/account/api-keys

### 3. Set Usage Limits
1. Go to https://platform.openai.com/account/billing/limits
2. Set **Hard Limit** (stops API when reached)
3. Set **Soft Limit** (email alerts)
4. Recommended: $10-50/month depending on usage

### 4. Security Best Practices

#### ✅ DO:
- Keep API keys in `.env` files only
- Use different keys for dev/staging/production
- Set spending limits on OpenAI account
- Monitor usage monthly
- Rotate keys every 3-6 months
- Use service accounts for production

#### ❌ DON'T:
- Commit API keys to version control
- Share keys in chat/email
- Use production keys in development
- Leave unused keys active
- Skip billing monitoring

### 5. Emergency Response

If key is compromised:
1. **Immediately revoke** at https://platform.openai.com/account/api-keys
2. **Generate new key**
3. **Update all environments**
4. **Check billing** for unexpected usage
5. **Review usage logs**

### 6. Backup Strategy
- Keep 2 active keys (primary + backup)
- Test backup key monthly
- Store backup key securely (password manager)

### 7. Production Considerations
- Use environment-specific keys
- Implement key rotation automation
- Set up monitoring alerts
- Use proxy/gateway for additional control

## Common Reasons Keys Become Invalid

1. **Billing Issues**
   - Payment method declined
   - Credit card expired
   - Spending limit reached

2. **Account Issues**
   - Account suspended
   - Policy violations
   - Unusual usage patterns

3. **Security**
   - Key compromised/leaked
   - Suspicious activity detected
   - Manual revocation

4. **OpenAI Changes**
   - API version deprecation
   - Model access changes
   - Service updates

## Monitoring Script Usage

```bash
# Add to package.json scripts
"check-api-health": "node scripts/check-openai-usage.js"

# Run weekly
npm run check-api-health
```