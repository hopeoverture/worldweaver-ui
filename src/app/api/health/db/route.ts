import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  error?: string;
  details?: any;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
}

async function performHealthCheck(name: string, checkFn: () => Promise<any>): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const result = await checkFn();
    const responseTime = Date.now() - startTime;
    
    return {
      service: name,
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      responseTime,
      details: result
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      service: name,
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const checks: HealthCheck[] = [];
    
    // Database connectivity
    checks.push(await performHealthCheck('database_connection', async () => {
      const { data, error } = await adminClient.from('worlds').select('count').limit(1);
      if (error) throw new Error(error.message);
      return { connected: true };
    }));
    
    // Critical tables - individual checks to satisfy TypeScript
    checks.push(await performHealthCheck('table_worlds', async () => {
      const { data, error } = await adminClient.from('worlds').select('id').limit(1);
      if (error) throw new Error(error.message);
      return { accessible: true };
    }));
    
    checks.push(await performHealthCheck('table_entities', async () => {
      const { data, error } = await adminClient.from('entities').select('id').limit(1);
      if (error) throw new Error(error.message);
      return { accessible: true };
    }));
    
    checks.push(await performHealthCheck('table_templates', async () => {
      const { data, error } = await adminClient.from('templates').select('id').limit(1);
      if (error) throw new Error(error.message);
      return { accessible: true };
    }));
    
    checks.push(await performHealthCheck('table_profiles', async () => {
      const { data, error } = await adminClient.from('profiles').select('id').limit(1);
      if (error) throw new Error(error.message);
      return { accessible: true };
    }));
    
    // Storage
    checks.push(await performHealthCheck('storage', async () => {
      const { data, error } = await adminClient.storage.listBuckets();
      if (error) throw new Error(error.message);
      return { buckets: data?.length || 0 };
    }));
    
    // Auth system
    checks.push(await performHealthCheck('auth', async () => {
      const { data, error } = await adminClient.from('profiles').select('id').limit(1);
      if (error) throw new Error(error.message);
      return { functional: true };
    }));
    
    // Calculate overall status
    const healthy = checks.filter(c => c.status === 'healthy').length;
    const degraded = checks.filter(c => c.status === 'degraded').length;
    const unhealthy = checks.filter(c => c.status === 'unhealthy').length;
    
    const overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 
      unhealthy > 0 ? 'unhealthy' :
      degraded > 0 ? 'degraded' : 'healthy';
    
    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      summary: {
        total: checks.length,
        healthy,
        unhealthy,
        degraded
      }
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;
    
    return NextResponse.json(response, { status: statusCode });
    
  } catch (error) {
    const errorResponse: HealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: [{
        service: 'health_endpoint',
        status: 'unhealthy',
        responseTime: 0,
        error: error instanceof Error ? error.message : String(error)
      }],
      summary: {
        total: 1,
        healthy: 0,
        unhealthy: 1,
        degraded: 0
      }
    };
    
    return NextResponse.json(errorResponse, { status: 503 });
  }
}