import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, User, getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { INITIAL_APPS } from './data/initialApps';
import { AppProject, ClubMember, ClubProfile, ClubSchedule, MemberRequest, MemberStatus } from './types';
import { safeUrl } from './storage';

const app = initializeApp({
  apiKey: 'AIzaSyBinRsli5VeiRGicH-JRQu1hk-VwRh5b4M',
  authDomain: 'app-factory-festival.firebaseapp.com',
  projectId: 'app-factory-festival',
  storageBucket: 'app-factory-festival.firebasestorage.app',
  messagingSenderId: '462930806308',
  appId: '1:462930806308:web:f9cc7f186213cdb7e3fab1',
});

export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const observeUser = (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback);
export const login = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);

const SCHOOL_DOMAIN = '@g.cnees.kr';
export const isSchoolAccount = (user: User | null) => {
  const email = user?.email?.trim().toLowerCase() || '';
  return !!user && user.emailVerified && email.endsWith(SCHOOL_DOMAIN);
};

const projectFields = (project: AppProject, creatorId: string) => ({
  title: project.title.trim().slice(0, 100),
  description: project.description.trim().slice(0, 500),
  category: project.category,
  tech: project.tech.slice(0, 80),
  badges: project.badges.slice(0, 4).map(value => value.slice(0, 40)),
  actionText: project.actionText.slice(0, 60),
  actionIcon: project.actionIcon.slice(0, 40),
  actionBgColor: project.actionBgColor.slice(0, 80),
  authorName: project.authorName.trim().slice(0, 80),
  authorRole: project.authorRole.slice(0, 80),
  authorInitial: project.authorInitial.slice(0, 4),
  authorInitialBg: project.authorInitialBg.slice(0, 80),
  imageUrl: project.imageUrl,
  rating: project.rating,
  plays: project.plays,
  commentsCount: project.commentsCount,
  likes: project.likes,
  url: project.url,
  simulatorType: project.simulatorType,
  hidden: project.hidden ?? false,
  creatorId,
  createdBy: creatorId,
  aiTools: project.aiTools || [],
  aiUsage: project.aiUsage || [],
  aiNote: project.aiNote || '',
  createdAt: serverTimestamp(),
});

function asProject(id: string, data: Record<string, unknown>, likedIds: Set<string>): AppProject | null {
  const candidate = { ...data, id, hidden: data.hidden === true, isLiked: likedIds.has(id) } as unknown as AppProject;
  if (!candidate.title || !candidate.authorName || !safeUrl(candidate.url) || !safeUrl(candidate.imageUrl)) return null;
  return candidate;
}

export function subscribeProjects(
  user: User | null,
  isAdmin: boolean,
  likedIds: Set<string>,
  onChange: (projects: AppProject[]) => void,
  onError: (error: Error) => void,
) {
  const sourceResults = new Map<number, Map<string, AppProject>>();
  const update = () => {
    const merged = new Map<string, AppProject>();
    sourceResults.forEach(items => items.forEach((project, id) => merged.set(id, project)));
    const projects = [...merged.values()].sort((a, b) => a.id.localeCompare(b.id));
    onChange(projects.length ? projects : INITIAL_APPS.map(item => ({ ...item, isLiked: likedIds.has(item.id) })));
  };
  const queries = [query(collection(db, 'projects'), where('hidden', '==', false))];
  if (user) queries.push(query(collection(db, 'projects'), where('creatorId', '==', user.uid)));
  if (isAdmin) queries.push(collection(db, 'projects') as any);
  const unsubs = queries.map((source, index) => onSnapshot(source, snapshot => {
    const current = new Map<string, AppProject>();
    snapshot.docs.forEach(item => {
      const project = asProject(item.id, item.data(), likedIds);
      if (project) current.set(project.id, project);
    });
    sourceResults.set(index, current);
    update();
  }, onError));
  return () => unsubs.forEach(unsubscribe => unsubscribe());
}

export async function isAdminUser(user: User | null) {
  return !!user && (await getDoc(doc(db, 'admins', user.uid))).exists();
}

export function subscribeMembership(uid: string, onChange: (member: ClubMember | null) => void, onError: (error: Error) => void) {
  return onSnapshot(doc(db, 'members', uid), snapshot => onChange(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as ClubMember) : null), onError);
}

export function subscribeMemberRequest(uid: string, onChange: (request: MemberRequest | null) => void, onError: (error: Error) => void) {
  return onSnapshot(doc(db, 'memberRequests', uid), snapshot => onChange(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as MemberRequest) : null), onError);
}

export function subscribeMemberRequests(isAdmin: boolean, onChange: (requests: MemberRequest[]) => void, onError: (error: Error) => void) {
  if (!isAdmin) { onChange([]); return () => undefined; }
  return onSnapshot(collection(db, 'memberRequests'), snapshot => {
    const requests = snapshot.docs
      .map(item => ({ id: item.id, ...item.data() } as MemberRequest))
      .sort((a, b) => String(a.requestedAt || '').localeCompare(String(b.requestedAt || '')));
    onChange(requests);
  }, onError);
}

export async function submitMemberRequest(user: User) {
  if (!isSchoolAccount(user)) throw new Error('school-account-required');
  const ref = doc(db, 'memberRequests', user.uid);
  const existing = await getDoc(ref);
  if (existing.exists() && ['pending', 'approved'].includes(String(existing.data().status))) return;
  await setDoc(ref, {
    email: user.email,
    displayName: user.displayName || '학교 계정 사용자',
    photoUrl: user.photoURL || '',
    status: 'pending',
    requestedAt: serverTimestamp(),
  }, { merge: true });
}

export async function reviewMemberRequest(request: MemberRequest, status: MemberStatus, admin: User) {
  await updateDoc(doc(db, 'memberRequests', request.id), { status, reviewedAt: serverTimestamp(), reviewedBy: admin.uid });
  if (status === 'approved') {
    await setDoc(doc(db, 'members', request.id), {
      name: request.displayName,
      role: '동아리 멤버',
      grade: '',
      introduction: '',
      photoUrl: request.photoUrl || '',
      order: 999,
      status: 'active',
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
  if (status === 'blocked') await setDoc(doc(db, 'members', request.id), { status: 'hidden', updatedAt: serverTimestamp() }, { merge: true });
}

const defaultClubProfile: ClubProfile = {
  id: 'main', name: '앱팩토리 (AppFactory)', tagline: '상상을 코드로, 아이디어를 웹앱으로!',
  description: '중학교 친구들이 자유롭게 모여 게임, AI 도구, 학사 편의 기능을 개발하고 공유하는 웹 개발 동아리입니다.',
  festivalLabel: '🚀 2026 페스티벌',
};

export function subscribeClubProfile(onChange: (profile: ClubProfile) => void, onError: (error: Error) => void) {
  return onSnapshot(doc(db, 'clubProfile', 'main'), snapshot => onChange(snapshot.exists() ? ({ id: 'main', ...snapshot.data() } as ClubProfile) : defaultClubProfile), onError);
}

export function subscribeClubSchedules(isAdmin: boolean, onChange: (items: ClubSchedule[]) => void, onError: (error: Error) => void) {
  const source = isAdmin ? collection(db, 'clubSchedules') : query(collection(db, 'clubSchedules'), where('hidden', '==', false));
  return onSnapshot(source, snapshot => onChange(snapshot.docs.map(item => ({ id: item.id, hidden: false, ...item.data() } as ClubSchedule)).sort((a, b) => a.order - b.order)), onError);
}

export function subscribeClubMembers(isAdmin: boolean, onChange: (items: ClubMember[]) => void, onError: (error: Error) => void) {
  const source = isAdmin ? collection(db, 'members') : query(collection(db, 'members'), where('status', '==', 'active'));
  return onSnapshot(source, snapshot => onChange(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ClubMember)).filter(item => isAdmin || item.status === 'active').sort((a, b) => a.order - b.order)), onError);
}

export async function saveClubProfile(profile: Partial<ClubProfile>, admin: User) {
  await setDoc(doc(db, 'clubProfile', 'main'), { ...profile, updatedAt: serverTimestamp(), updatedBy: admin.uid }, { merge: true });
}

export async function saveClubSchedule(item: Partial<ClubSchedule>, admin: User) {
  const id = item.id || `schedule-${crypto.randomUUID()}`;
  await setDoc(doc(db, 'clubSchedules', id), { title: item.title || '', date: item.date || '', location: item.location || '', description: item.description || '', order: item.order ?? 999, hidden: item.hidden ?? false, updatedAt: serverTimestamp(), updatedBy: admin.uid }, { merge: true });
}

export async function hideClubSchedule(id: string, admin: User) { await updateDoc(doc(db, 'clubSchedules', id), { hidden: true, hiddenAt: serverTimestamp(), hiddenBy: admin.uid }); }
export async function restoreClubSchedule(id: string) { await updateDoc(doc(db, 'clubSchedules', id), { hidden: false, hiddenAt: null, hiddenBy: null }); }
export async function deleteClubSchedule(id: string) { await deleteDoc(doc(db, 'clubSchedules', id)); }

export async function saveClubMember(item: Partial<ClubMember>, admin: User) {
  const id = item.id || `member-${crypto.randomUUID()}`;
  await setDoc(doc(db, 'members', id), { name: item.name || '', role: item.role || '동아리 멤버', grade: item.grade || '', introduction: item.introduction || '', photoUrl: item.photoUrl || '', order: item.order ?? 999, status: item.status || 'active', updatedAt: serverTimestamp(), updatedBy: admin.uid }, { merge: true });
}
export async function hideClubMember(id: string, admin: User) { await updateDoc(doc(db, 'members', id), { status: 'hidden', hiddenAt: serverTimestamp(), hiddenBy: admin.uid }); }
export async function restoreClubMember(id: string) { await updateDoc(doc(db, 'members', id), { status: 'active', hiddenAt: null, hiddenBy: null }); }
export async function deleteClubMember(id: string) { await deleteDoc(doc(db, 'members', id)); }

export function subscribeLikes(uid: string, onChange: (ids: Set<string>) => void, onError: (error: Error) => void) {
  return onSnapshot(collection(db, 'users', uid, 'likes'), snapshot => {
    onChange(new Set(snapshot.docs.map(item => item.id)));
  }, onError);
}

export async function seedInitialProjects(user: User) {
  await Promise.all(INITIAL_APPS.map(async project => {
    try {
      await runTransaction(db, async transaction => {
        const ref = doc(db, 'projects', project.id);
        const existing = await transaction.get(ref);
        if (!existing.exists()) {
          transaction.set(ref, projectFields({ ...project, rating: 5, plays: 0, commentsCount: 0, likes: 0 }, user.uid));
        }
      });
    }
    catch (error: any) { if (error?.code !== 'permission-denied') throw error; }
  }));
}

export async function createProject(project: AppProject, user: User) {
  await setDoc(doc(db, 'projects', project.id), projectFields(project, user.uid));
}

export async function toggleProjectLike(projectId: string, user: User) {
  const projectRef = doc(db, 'projects', projectId);
  const likeRef = doc(db, 'users', user.uid, 'likes', projectId);
  await runTransaction(db, async transaction => {
    const [projectSnapshot, likeSnapshot] = await Promise.all([transaction.get(projectRef), transaction.get(likeRef)]);
    if (!projectSnapshot.exists()) throw new Error('project-not-found');
    const currentLikes = Math.max(0, Number(projectSnapshot.data().likes) || 0);
    if (likeSnapshot.exists()) {
      transaction.delete(likeRef);
      transaction.update(projectRef, { likes: Math.max(0, currentLikes - 1) });
    } else {
      transaction.set(likeRef, { projectId, createdAt: serverTimestamp() });
      transaction.update(projectRef, { likes: currentLikes + 1 });
    }
  });
}

export async function rateProject(projectId: string, user: User) {
  await setDoc(doc(db, 'users', user.uid, 'ratings', projectId), { projectId, value: 5, createdAt: serverTimestamp() });
}

export async function hideProject(projectId: string, user: User) {
  await updateDoc(doc(db, 'projects', projectId), { hidden: true, hiddenAt: serverTimestamp(), hiddenBy: user.uid });
}

export async function restoreProject(projectId: string) {
  await updateDoc(doc(db, 'projects', projectId), { hidden: false, hiddenAt: null, hiddenBy: null });
}

export async function permanentlyDeleteProject(projectId: string) {
  await deleteDoc(doc(db, 'projects', projectId));
}
