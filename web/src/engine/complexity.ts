export const growth = [
  { name: 'O(1)', color: '#6b8fb4', count: (_n: number) => 1, note: '输入增加，操作次数不变。' },
  { name: 'O(log n)', color: '#4eae91', count: (n: number) => Math.max(1, Math.ceil(Math.log2(n))), note: '每步淘汰一半候选，例如折半查找。' },
  { name: 'O(n)', color: '#3c8cc2', count: (n: number) => n, note: '每个元素处理一次，例如线性查找。' },
  { name: 'O(n log n)', color: '#dc9b4c', count: (n: number) => n * Math.max(1, Math.ceil(Math.log2(n))), note: '分层处理全部元素，例如高效排序。' },
  { name: 'O(n²)', color: '#ce6d71', count: (n: number) => n * n, note: '双重遍历，例如简单排序的最坏情况。' },
] as const

export function complexityCounts(n: number) {
  if (!Number.isInteger(n) || n < 1 || n > 128) throw new Error('输入规模须为 1 至 128 的整数。')
  return growth.map(item => item.count(n))
}
