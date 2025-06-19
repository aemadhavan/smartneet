// src/app/api/admin/diagnostics/practice/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { runDiagnostics } from '../../../../../../scripts/practice-module-diagnostics';
import { runFixes } from '../../../../../../scripts/fix-practice-issues';

/**
 * GET - Run diagnostics on practice module
 * POST - Run fixes for practice module issues
 */

export async function GET() {
  try {
    const { userId } = await auth();
    
    // In production, add admin check here
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add admin role check if needed
    // const user = await clerkClient.users.getUser(userId);
    // if (!user.privateMetadata?.isAdmin) {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    console.log('🔍 Running practice module diagnostics...');
    
    const { results, report } = await runDiagnostics();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_issues: results.length,
        critical_issues: results.filter(r => r.severity === 'critical').length,
        high_priority: results.filter(r => r.severity === 'high').length,
        medium_priority: results.filter(r => r.severity === 'medium').length,
        low_priority: results.filter(r => r.severity === 'low').length
      },
      results,
      report
    });
  } catch (error) {
    console.error('Error running diagnostics:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    // In production, add admin check here
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, dryRun = true } = body;

    if (action === 'fix-all') {
      console.log('🔧 Running practice module fixes...');
      
      if (dryRun) {
        // Run diagnostics only to show what would be fixed
        const { results, report } = await runDiagnostics();
        
        return NextResponse.json({
          success: true,
          dry_run: true,
          message: 'Dry run completed - no changes made',
          issues_found: results.length,
          report,
          timestamp: new Date().toISOString()
        });
      } else {
        // Actually run the fixes
        const { results, report } = await runFixes();
        
        return NextResponse.json({
          success: true,
          dry_run: false,
          message: 'Fixes applied successfully',
          operations: results.length,
          successful_operations: results.filter(r => r.success).length,
          failed_operations: results.filter(r => !r.success).length,
          total_records_affected: results.reduce((sum, r) => sum + r.affected_count, 0),
          results,
          report,
          timestamp: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "fix-all" with optional "dryRun": false'
    }, { status: 400 });

  } catch (error) {
    console.error('Error running fixes:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Example usage:
// GET /api/admin/diagnostics/practice - Run diagnostics
// POST /api/admin/diagnostics/practice - Body: { "action": "fix-all", "dryRun": true }