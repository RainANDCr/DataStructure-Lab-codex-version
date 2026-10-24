// 根据用户提供的 2027 年 408 数据结构考纲文本整理，非官方核验版本。
export const syllabus2027 = [
  { title: '一、基本概念', topics: [['数据结构的基本概念', 'dataStructure'], ['算法的基本概念', 'algorithmBasics'], ['时间与空间复杂度', 'complexity']] },
  { title: '二、线性表', topics: [['线性表的基本概念', 'linear'], ['顺序存储', 'array'], ['链式存储', 'linked'], ['线性表的应用', 'doublyLinked']] },
  { title: '三、栈、队列和数组', topics: [['栈和队列的基本概念', 'stack'], ['顺序存储结构', 'circularQueue'], ['链式存储结构', 'linkedQueue'], ['多维数组的存储', 'matrix'], ['特殊矩阵的压缩存储', 'compressedMatrix'], ['栈、队列和数组的应用', 'brackets']] },
  { title: '四、树与二叉树', topics: [['树的基本概念', 'tree'], ['二叉树的定义及特性', 'binaryTree'], ['顺序和链式存储', 'binaryTree'], ['二叉树的遍历', 'traversal'], ['线索二叉树', 'threaded'], ['树和森林的存储、转换与遍历', 'forest'], ['哈夫曼树与编码', 'huffman'], ['并查集', 'unionFind'], ['堆', 'heap']] },
  { title: '五、图', topics: [['图的基本概念', 'graph'], ['邻接矩阵、邻接表、邻接多重表与十字链表', 'graphStorage'], ['深度优先与广度优先搜索', 'graphTraversal'], ['最小生成树', 'mst'], ['最短路径', 'shortestPath'], ['拓扑排序', 'topologicalOrder'], ['关键路径', 'criticalPath']] },
  { title: '六、查找', topics: [['查找的基本概念与顺序查找', 'search'], ['分块查找', 'blockSearch'], ['折半查找', 'binarySearch'], ['二叉搜索树与平衡二叉树', 'bst'], ['红黑树', 'redBlack'], ['B 树与 B⁺ 树', 'bTree'], ['散列表', 'hashTheory'], ['字符串模式匹配', 'kmpTheory'], ['查找算法分析与应用', 'searchAnalysis']] },
  { title: '七、排序', topics: [['排序的基本概念与稳定性', 'sorting'], ['直接插入排序', 'insertion'], ['折半插入排序', 'binaryInsertion'], ['起泡排序', 'bubble'], ['简单选择排序', 'selection'], ['希尔排序', 'shell'], ['快速排序', 'quick'], ['堆排序', 'heap'], ['二路归并排序', 'merge'], ['基数排序', 'radix'], ['外部排序', 'externalSort'], ['排序算法分析与应用', 'stability']] },
] as const
