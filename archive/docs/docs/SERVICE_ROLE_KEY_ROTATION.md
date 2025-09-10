# Service Role Key Rotation Process

This document outlines the process for rotating Supabase service role keys in case of compromise or as part of regular security maintenance.

## When to Rotate

- **Immediately** if the key is suspected to be compromised
- **Immediately** if the key is accidentally committed to version control
- **Every 90 days** as part of regular security maintenance
- Before major production deployments
- When team members with access leave the organization

## Rotation Steps

### 1. Generate New Service Role Key

1. Log into Supabase Dashboard
2. Navigate to Settings → API
3. Click on "Reset" next to the service_role key
4. **IMPORTANT**: Copy the new key immediately - it will only be shown once
5. Save the new key securely (password manager recommended)

### 2. Update Environment Variables

#### Development Environment
```bash
# Update your local .env.local file
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW-SERVICE-ROLE-KEY-HERE
```

#### Production Environment (Vercel)
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Edit `SUPABASE_SERVICE_ROLE_KEY`
3. Replace with new key value
4. **IMPORTANT**: Redeploy immediately after updating

#### Staging Environment
1. Update staging environment variables
2. Test the new key works correctly
3. Verify all admin functions still work

### 3. Validate Key Rotation

```bash
# Test the new key works
npm run test:admin-endpoints

# Verify environment validation passes
node -e "require('./src/lib/env.ts').logEnvironmentStatus()"
```

### 4. Notify Team

- Post in team channel that service role key has been rotated
- Ensure all team members update their local `.env.local` files
- Update any CI/CD systems that may use the service role key
- Update documentation and deployment scripts

### 5. Clean Up Old Key

- Remove old key from password managers
- Clear any temporary files that may contain the old key
- Verify old key is no longer active in Supabase dashboard

## Emergency Rotation (Compromised Key)

If a service role key is compromised:

1. **IMMEDIATELY** rotate the key in Supabase (steps 1-2 above)
2. **IMMEDIATELY** update production environment and redeploy
3. Review database access logs for suspicious activity
4. Check all admin endpoints for unauthorized usage
5. Consider rotating all other API keys as a precaution
6. Document the incident and lessons learned

## Prevention

- Never commit `.env.local` or any file containing the service role key
- Use environment variable scanning in CI/CD
- Regularly audit who has access to production environment variables
- Use separate keys for different environments when possible
- Monitor service role key usage through Supabase dashboard

## Verification Commands

```bash
# Check if any secrets are in git history
git log --all --full-history --source --grep="supabase.*key\|secret\|password" -i --oneline

# Verify no .env files are tracked
git ls-files | grep "\.env"

# Check current environment status
npm run validate:env
```

## Automation

Consider setting up:
- Calendar reminders for quarterly key rotation
- Monitoring alerts for unusual service role key usage
- Automated testing of key rotation in staging environment

## Support Contacts

- **Supabase Support**: support@supabase.io
- **Team Lead**: [Your team lead contact]
- **Security Team**: [Your security team contact]

---

**Last Updated**: September 8, 2025  
**Next Scheduled Rotation**: December 8, 2025  
**Document Owner**: DevOps Team
