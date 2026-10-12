'use server';

import { cookies } from 'next/headers';
import { assertSession } from '@/lib/admin/session';
import { SESSION_HOURS } from '@/lib/admin/token';
import { unknownProject } from './project-access';
import { PROJECT_COOKIE, getProject, summary, type ProjectSummary } from './projects';

/**
 * The project switcher. Only an ID from the server-side list is accepted and
 * remembered; the cookie holds that ID and nothing else, and every page and
 * action resolves the repository from it on the server.
 */
export async function switchProject(id: unknown): Promise<{ ok: true; project: ProjectSummary } | { ok: false; message: string }> {
  await assertSession();
  const project = getProject(id);
  if (!project) return { ok: false, message: unknownProject };
  (await cookies()).set(PROJECT_COOKIE, project.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    maxAge: SESSION_HOURS * 3600,
  });
  return { ok: true, project: summary(project) };
}
