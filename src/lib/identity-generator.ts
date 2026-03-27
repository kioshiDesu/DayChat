const adjectives = ['Swift', 'Cool', 'Brave', 'Quiet', 'Happy', 'Wild', 'Clever', 'Bright', 'Calm', 'Bold'];
const animals = ['Tiger', 'Panda', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Hawk', 'Lynx', 'Owl', 'Deer'];

export function generateDisplayName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj} ${animal} ${num}`;
}
