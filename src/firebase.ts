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
import { AppProject } from './types';
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
  const results = new Map<string, AppProject>();
  const update = () => {
    const projects = [...results.values()].sort((a, b) => a.id.localeCompare(b.id));
    onChange(projects.length ? projects : INITIAL_APPS.map(item => ({ ...item, isLiked: likedIds.has(item.id) })));
  };
  const queries = [query(collection(db, 'projects'), where('hidden', '==', false))];
  if (user) queries.push(query(collection(db, 'projects'), where('creatorId', '==', user.uid)));
  if (isAdmin) queries.push(collection(db, 'projects') as any);
  const unsubs = queries.map(source => onSnapshot(source, snapshot => {
    snapshot.docs.forEach(item => {
      const project = asProject(item.id, item.data(), likedIds);
      if (project) results.set(project.id, project);
    });
    update();
  }, onError));
  return () => unsubs.forEach(unsubscribe => unsubscribe());
}

export async function isAdminUser(user: User | null) {
  return !!user && (await getDoc(doc(db, 'admins', user.uid))).exists();
}

export function subscribeLikes(uid: string, onChange: (ids: Set<string>) => void, onError: (error: Error) => void) {
  return onSnapshot(collection(db, 'users', uid, 'likes'), snapshot => {
    onChange(new Set(snapshot.docs.map(item => item.id)));
  }, onError);
}

export async function seedInitialProjects(user: User) {
  await Promise.all(INITIAL_APPS.map(async project => {
    try { await setDoc(doc(db, 'projects', project.id), projectFields({ ...project, rating: 5, plays: 0, commentsCount: 0, likes: 0 }, user.uid)); }
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
