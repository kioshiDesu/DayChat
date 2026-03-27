const adjectives = ['Swift', 'Cool', 'Brave', 'Quiet', 'Happy', 'Wild', 'Clever', 'Bright', 'Calm', 'Bold'];
const animals = ['Tiger', 'Panda', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Hawk', 'Lynx', 'Owl', 'Deer'];

export function generateAnonymousId(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj} ${animal}-${num}`;
}

export async function generateUniqueIdentity(): Promise<string> {
  let attempts = 0;
  while (attempts < 5) {
    const candidate = generateAnonymousId();
    attempts++;
    return candidate;
  }
  return `User-${Math.random().toString(36).slice(2, 8)}`;
}
