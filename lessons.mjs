export const lessons = {
  array:{title:'顺序表',english:'Sequential list',chapter:'第 2 章 · 线性表',summary:'连续存储，按位置访问。观察插入和删除时，元素为什么需要移动。',time:'O(n)',space:'O(1)',kind:'cells',default:[12,25,37,48,60],principle:'顺序表用连续空间存储元素。下标访问是 O(1)，但插入或删除可能移动多个元素。',tip:'观察移动方向：插入从后往前，删除从前往后，避免覆盖尚未移动的数据。'},
  linked:{title:'单链表',english:'Singly linked list',chapter:'第 2 章 · 线性表',summary:'数据与指针相连。沿着 next 找到前驱，再改变连接关系。',time:'O(n)',space:'O(1)',kind:'linked',default:[12,25,37,48],principle:'每个节点包含值和 next 指针。查找前驱需要 O(n)，已知前驱后修改连接只需 O(1)。',tip:'本例使用哨兵头节点。插入先连接新节点的 next，再修改前驱的 next，避免丢失后续链表。'},
  stack:{title:'栈',english:'Stack',chapter:'第 3 章 · 栈和队列',summary:'最后进入的元素最先离开。所有操作都发生在栈顶。',time:'O(1)',space:'O(1)',kind:'stack',default:[12,25,37],principle:'栈遵循后进先出（LIFO）。本例以数组末端为栈顶，top = n − 1。',tip:'空栈不能出栈。C++ vector 和 Python list 可能扩容，追加为摊还 O(1)，一次扩容可能耗时 O(n)。'},
  queue:{title:'队列',english:'Queue',chapter:'第 3 章 · 栈和队列',summary:'先到先出。从队尾加入，从队首取出，观察队列的顺序。',time:'入队 O(1) / 出队 O(n)',space:'O(1)',kind:'queue',default:[12,25,37,48],principle:'队列遵循先进先出（FIFO）。本例是移动式顺序队列：出队后其余元素左移。',tip:'移动式顺序队列的出队是 O(n)。后续可用循环队列避免移动，将出队降到 O(1)。'},
  string:{title:'朴素模式匹配',english:'Naive string search',chapter:'第 4 章 · 串',summary:'把模式串依次对齐主串的每个起点，遇到失配就向右移动。',time:'O(nm)',space:'O(1)',kind:'string',default:[...'ABABAC'],principle:'从主串的每个可能起点出发，逐个比较模式串字符。失配时回到模式串开头，尝试下一个起点。',tip:'返回第一次匹配的下标，未找到返回 −1。输入限制为英文字母和数字，以便 C、C++、Python 三种代码的字符下标一致；区分大小写。'},
  tree:{title:'二叉树遍历',english:'Binary tree traversal',chapter:'第 6 章 · 树和二叉树',summary:'对比前序、中序、后序和层序遍历。',time:'O(n)',space:'递归 O(h) / 层序 O(w)',kind:'tree',default:[8,4,12,2,6,10,14],principle:'前序：根左右；中序：左根右；后序：左右根。层序使用队列，逐层访问。每个节点都访问一次。',tip:'本例按层序输入生成完全二叉树；下标 i 的孩子是 2i+1 与 2i+2。h 为树高、w 为最大层宽；它不一定是二叉搜索树。'},
  graph:{title:'图的遍历',english:'Graph traversal',chapter:'第 7 章 · 图',summary:'从一个节点出发，沿边访问其他节点。对比广度优先与深度优先。',time:'O(V + E)',space:'O(V)',kind:'graph',default:[0,1,2,3,4,5],principle:'广度优先用队列逐层扩展；深度优先用递归沿一条路径继续探索。每个节点和边最多处理有限次。',tip:'边使用节点下标，如 0-1。这里是无向图，邻居按下标升序处理；如果不连通，会继续遍历剩余分量。'},
  binary:{title:'二分查找',english:'Binary search',chapter:'第 8 章 · 查找',summary:'在有序序列中，每次比较都排除一半搜索区间。',time:'O(log n)',space:'O(1)',kind:'cells',default:[8,18,24,30,42,55,65,72],principle:'前提是序列有序。若中点小于目标，向右查找；若中点大于目标，向左查找。',tip:'本例使用闭区间 [lo, hi]。当 lo > hi 时搜索结束，返回 −1；有重复值时返回其中一次匹配。'},
  bubble:{title:'冒泡排序',english:'Bubble sort',chapter:'第 9 章 · 排序',summary:'比较相邻元素，让较大的值一步步「冒」到右侧。',time:'O(n²)',space:'O(1)',kind:'bars',default:[42,18,65,30,8,55,24,72],principle:'每一轮比较相邻元素，逆序就交换。一轮结束后，未排序区间的最大值就到了最右侧。',tip:'这是未加入提前终止优化的冒泡排序，最好、平均、最坏时间均为 O(n²)。相等元素不交换，因此排序稳定。'},
  quick:{title:'快速排序',english:'Quick sort',chapter:'第 9 章 · 排序',summary:'选定基准，将小元素分到左侧，再递归处理两个子区间。',time:'平均 O(n log n)',space:'平均 O(log n)',kind:'bars',default:[42,18,65,30,8,55,24,72],principle:'本例使用末尾元素作为基准的 Lomuto 分区。分区后，基准处于最终位置，再递归处理左右两侧。',tip:'最坏时间 O(n²)、递归空间 O(n)，例如已排序或大量相等的数据。快速排序通常不稳定。'},
};

// Each semantic tag follows the same operation in all three teaching snippets.
function rows(text) { return text.split('\n').map(s=>{const p=s.indexOf('|');return {tag:s.slice(0,p),text:s.slice(p+1)};}); }
const bubble={
 C:`init|void bubble(int a[], int n) {
outer|  for (int i = 0; i < n - 1; i++) {
loop|    for (int j = 0; j < n - 1 - i; j++) {
compare|      if (a[j] > a[j + 1]) {
swap|        int t = a[j]; a[j] = a[j+1]; a[j+1] = t;
end|      }
end|    }
end|  }
done|}`,
 'C++':`init|void bubble(vector<int>& a) {
size|  int n = static_cast<int>(a.size());
outer|  for (int i = 0; i < n - 1; ++i) {
loop|    for (int j = 0; j < n - 1 - i; ++j) {
compare|      if (a[j] > a[j + 1]) {
swap|        swap(a[j], a[j + 1]);
end|      }
end|    }
end|  }
done|}`,
 Python:`init|def bubble(a):
outer|    for i in range(len(a) - 1):
loop|        for j in range(len(a) - 1 - i):
compare|            if a[j] > a[j + 1]:
swap|                a[j], a[j+1] = a[j+1], a[j]
done|    return a`};
const quick={
 C:`init|void quick(int a[], int lo, int hi) {
base|  if (lo >= hi) return;
pivot|  int pivot = a[hi], i = lo;
loop|  for (int j = lo; j < hi; j++) {
compare|    if (a[j] < pivot) {
swap|      int t = a[i]; a[i] = a[j]; a[j] = t;
advance|      i++;
end|    }
end|  }
place|  int t = a[i]; a[i] = a[hi]; a[hi] = t;
recurse|  quick(a, lo, i - 1); quick(a, i + 1, hi);
done|}`,
 'C++':`init|void quick(vector<int>& a, int lo, int hi) {
base|  if (lo >= hi) return;
pivot|  int pivot = a[hi], i = lo;
loop|  for (int j = lo; j < hi; ++j) {
compare|    if (a[j] < pivot) {
swap|      swap(a[i], a[j]);
advance|      ++i;
end|    }
end|  }
place|  swap(a[i], a[hi]);
recurse|  quick(a, lo, i - 1); quick(a, i + 1, hi);
done|}`,
 Python:`init|def quick(a, lo, hi):
base|    if lo >= hi: return
pivot|    pivot, i = a[hi], lo
loop|    for j in range(lo, hi):
compare|        if a[j] < pivot:
swap|            a[i], a[j] = a[j], a[i]
advance|            i += 1
place|    a[i], a[hi] = a[hi], a[i]
recurse|    quick(a, lo, i - 1); quick(a, i + 1, hi)
done|    return a`};
const binary={
 C:`init|int binary(int a[], int n, int target) {
bounds|  int lo = 0, hi = n - 1;
loop|  while (lo <= hi) {
mid|    int mid = lo + (hi - lo) / 2;
found|    if (a[mid] == target) return mid;
right|    if (a[mid] < target) lo = mid + 1;
left|    else hi = mid - 1;
end|  }
done|  return -1;
end|}`,
 Python:`init|def binary(a, target):
bounds|    lo, hi = 0, len(a) - 1
loop|    while lo <= hi:
mid|        mid = lo + (hi - lo) // 2
found|        if a[mid] == target: return mid
right|        if a[mid] < target: lo = mid + 1
left|        else: hi = mid - 1
done|    return -1`};
binary['C++']=binary.C.replace('int a[], int n, int target','const vector<int>& a, int target').replace('hi = n - 1','hi = static_cast<int>(a.size()) - 1');

export function snippet(id,lang,options={}) {
  if(['bubble','quick','binary'].includes(id)) return rows(({bubble,quick,binary})[id][lang]);
  const py=lang==='Python', cpp=lang==='C++', insert=options.operation!=='remove';
  if(id==='string')return rows(py?`init|def search(text, pattern):
outer|    for i in range(len(text) - len(pattern) + 1):
setup|        j = 0
loop|        while j < len(pattern):
compare|            if text[i+j] != pattern[j]:
shift|                break
match|            j += 1
found|        if j == len(pattern): return i
done|    return -1`:cpp?`init|int search(const string& text, const string& pattern) {
outer|  for (int i = 0; i <= (int)text.size() - (int)pattern.size(); ++i) {
setup|    int j = 0;
loop|    while (j < (int)pattern.size()) {
compare|      if (text[i+j] != pattern[j]) {
shift|        break;
end|      }
match|      ++j;
end|    }
found|    if (j == (int)pattern.size()) return i;
end|  }
done|  return -1;
end|}`:`init|int search(const char* text, const char* pattern) {
size|  int n = strlen(text), m = strlen(pattern);
outer|  for (int i = 0; i <= n - m; ++i) {
setup|    int j = 0;
loop|    while (j < m) {
compare|      if (text[i+j] != pattern[j]) {
shift|        break;
end|      }
match|      ++j;
end|    }
found|    if (j == m) return i;
end|  }
done|  return -1;
end|}`);
  if(id==='graph') {
    if(options.order==='dfs') return rows(py?`init|def dfs(adj, labels, start):
base|    seen, output = set(), []
enter|    def walk(i):
visit|        seen.add(i); output.append(labels[i])
loop|        for j in sorted(adj[i]):
inspect|            if j not in seen:
recurse|                walk(j)
component|    for root in [start] + list(range(len(adj))):
guard|        if root not in seen: walk(root)
done|    return output`:cpp?`init|vector<int> dfs(const vector<vector<int>>& adj, const vector<int>& labels, int start) {
base|  vector<int> output, seen(adj.size());
enter|  function<void(int)> walk = [&](int i) {
visit|    seen[i] = 1; output.push_back(labels[i]);
loop|    for (int j : adj[i]) {
inspect|      if (!seen[j]) {
recurse|        walk(j);
end|      }
end|    }
end|  };
component|  for (int pass = -1; pass < static_cast<int>(adj.size()); ++pass)
root|    { int root = pass < 0 ? start : pass;
guard|    if (!seen[root]) walk(root);
end|    }
done|  return output;
end|}`:`init|void walk(int n, int adj[10][10], int labels[], int i, int seen[], int output[], int *count) {
enter|  // 从节点 i 深入
visit|  seen[i] = 1; output[(*count)++] = labels[i];
loop|  for (int j = 0; j < n; ++j) {
inspect|    if (adj[i][j] && !seen[j]) {
recurse|      walk(n, adj, labels, j, seen, output, count);
end|    }
end|  }
done|}
component|// 从起点开始，再对未访问的节点调用 walk`);
    return rows(py?`init|def bfs(adj, labels, start):
base|    seen, output = set(), []
component|    for root in [start] + list(range(len(adj))):
guard|        if root in seen: continue
enqueue|        queue = [root]; seen.add(root)
loop|        while queue:
dequeue|            i = queue.pop(0)
visit|            output.append(labels[i])
neighbors|            for j in sorted(adj[i]):
inspect|                if j not in seen:
enqueue|                    seen.add(j); queue.append(j)
done|    return output`:cpp?`init|vector<int> bfs(const vector<vector<int>>& adj, const vector<int>& labels, int start) {
base|  vector<int> output, seen(adj.size());
component|  for (int pass = -1; pass < static_cast<int>(adj.size()); ++pass) {
root|    int root = pass < 0 ? start : pass;
guard|    if (seen[root]) continue;
enqueue|    queue<int> q; q.push(root); seen[root] = 1;
loop|    while (!q.empty()) {
dequeue|      int i = q.front(); q.pop();
visit|      output.push_back(labels[i]);
neighbors|      for (int j : adj[i]) {
inspect|        if (!seen[j]) {
enqueue|          seen[j] = 1; q.push(j);
end|        }
end|      }
end|    }
end|  }
done|  return output;
end|}`:`init|void bfs(int n, int adj[10][10], int labels[], int start, int output[]) {
base|  int seen[10] = {0}, count = 0, queue[10];
component|  for (int pass = -1; pass < n; ++pass) {
root|    int root = pass < 0 ? start : pass;
guard|    if (seen[root]) continue;
enqueue|    int head = 0, tail = 0; queue[tail++] = root; seen[root] = 1;
loop|    while (head < tail) {
dequeue|      int i = queue[head++];
visit|      output[count++] = labels[i];
neighbors|      for (int j = 0; j < n; ++j) {
inspect|        if (adj[i][j] && !seen[j]) {
enqueue|          seen[j] = 1; queue[tail++] = j;
end|        }
end|      }
end|    }
end|  }
done|}`);
  }
  if(id==='tree') {
    if(options.order==='level') return rows(py?`init|def level(a):
setup|    queue, head, result = ([0] if a else []), 0, []
enqueue|    # 根节点或孩子入队
loop|    while head < len(queue):
dequeue|        i = queue[head]; head += 1
visit|        result.append(a[i])
enqueue|        if 2*i+1 < len(a): queue.append(2*i+1)
enqueue|        if 2*i+2 < len(a): queue.append(2*i+2)
done|    return result`:cpp?`init|void level(const vector<int>& a) {
setup|  queue<int> q;
enqueue|  if (!a.empty()) q.push(0);
loop|  while (!q.empty()) {
dequeue|    int i = q.front(); q.pop();
visit|    visit(a[i]);
enqueue|    if (2*i+1 < (int)a.size()) q.push(2*i+1);
enqueue|    if (2*i+2 < (int)a.size()) q.push(2*i+2);
end|  }
done|}`:`init|void level(int a[], int n) {
setup|  int q[15], head = 0, tail = 0;
enqueue|  if (n > 0) q[tail++] = 0;
loop|  while (head < tail) {
dequeue|    int i = q[head++];
visit|    visit(a[i]);
enqueue|    if (2*i+1 < n) q[tail++] = 2*i+1;
enqueue|    if (2*i+2 < n) q[tail++] = 2*i+2;
end|  }
done|}`);
    const visit=py?'visit|    result.append(a[i])':'visit|  visit(a[i]);';
    const left=py?'left|    walk(a, 2*i+1, result)':'left|  walk(a, n, 2*i+1);';
    const right=py?'right|    walk(a, 2*i+2, result)':'right|  walk(a, n, 2*i+2);';
    const sequence=options.order==='pre'?[visit,left,right]:options.order==='post'?[left,right,visit]:[left,visit,right];
    return rows([py?'init|def walk(a, i, result):':cpp?'init|void walk(const vector<int>& a, int n, int i) {':'init|void walk(int a[], int n, int i) {',py?'enter|    if i >= len(a): return':'enter|  if (i >= n) return;',...sequence,py?'done|    return result':'done|}'].join('\n'));
  }
  if(id==='array') {
    if(py) return rows(insert?`init|def insert(a, pos, value):
guard|    assert 0 <= pos <= len(a)
space|    a.append(0)
loop|    for j in range(len(a)-1, pos, -1):
shift|        a[j] = a[j-1]
insert|    a[pos] = value
done|    return a`:`init|def remove(a, pos):
select|    assert 0 <= pos < len(a)
loop|    for j in range(pos, len(a)-1):
shift|        a[j] = a[j+1]
remove|    a.pop()
done|    return a`);
    const head=cpp?'vector<int>& a, int pos':'int a[], int n, int pos';
    return rows(insert?`init|${cpp?'void':'int'} insert(${head}, int value) {
guard|  // 前置：0 <= pos <= n，且空间足够
size|  ${cpp?'int n = a.size(); a.resize(n + 1);':'// n 为当前有效长度'}
loop|  for (int j = n; j > pos; --j) {
shift|    a[j] = a[j-1];
end|  }
insert|  a[pos] = value;
done|  ${cpp?'return;':'return n + 1;'}
end|}`:`init|${cpp?'void':'int'} remove_at(${head}) {
select|  // 前置：0 <= pos < n
size|  ${cpp?'int n = a.size();':'// n 为当前有效长度'}
loop|  for (int j = pos; j < n - 1; ++j) {
shift|    a[j] = a[j+1];
end|  }
remove|  ${cpp?'a.pop_back();':'--n;'}
done|  ${cpp?'return;':'return n;'}
end|}`);
  }
  if(id==='linked') {
    if(py)return rows(insert?`init|def insert(head, pos, value):
base|    prev = head  # 哨兵头节点
loop|    for j in range(pos):
seek|        prev = prev.next
link|    node = Node(value, prev.next)
insert|    prev.next = node
done|    return head`:`init|def remove(head, pos):
base|    prev = head  # 已校验位置有效
loop|    for j in range(pos):
seek|        prev = prev.next
link|    node = prev.next
remove|    prev.next = node.next
done|    return head`);
    return rows(insert?`init|void insert(Node* head, int pos, int value) {
base|  Node* prev = head; // 哨兵头节点
loop|  for (int j = 0; j < pos; ++j) {
seek|    prev = prev->next;
end|  }
alloc|  Node* node = ${cpp?'new Node;':'malloc(sizeof(Node));'}
guard|  ${cpp?'// new 分配失败时抛出异常':'if (!node) return; // 调用者处理分配失败'}
link|  node->value = value; node->next = prev->next;
insert|  prev->next = node;
done|}`:`init|void remove_at(Node* head, int pos) {
base|  Node* prev = head; // 位置已校验有效
loop|  for (int j = 0; j < pos; ++j) {
seek|    prev = prev->next;
end|  }
link|  Node* node = prev->next;
remove|  prev->next = node->next;
free|  ${cpp?'delete node;':'free(node);'}
done|}`);
  }
  const stack=id==='stack';
  if(py) return rows(insert?`init|def ${stack?'push':'enqueue'}(a, value):
insert|    a.append(value)
done|    return a`:`init|def ${stack?'pop':'dequeue'}(a):
guard|    assert len(a) > 0
remove|    a.pop(${stack?'':'0'})
done|    return a`);
  if(cpp) return rows(insert?`init|void ${stack?'push':'enqueue'}(vector<int>& a, int value) {
insert|  a.push_back(value);
done|}`:`init|void ${stack?'pop':'dequeue'}(vector<int>& a) {
guard|  if (a.empty()) return;
remove|  ${stack?'a.pop_back();':'a.erase(a.begin());'}
done|}`);
  return rows(insert?`init|int ${stack?'push':'enqueue'}(int a[], int n, int value) {
guard|  // 前置：数组容量大于 n
insert|  a[n++] = value;
done|  return n;
end|}`:`init|int ${stack?'pop':'dequeue'}(int a[], int n) {
guard|  if (n == 0) return n;
remove|  ${stack?'--n;':'for (int j = 0; j < n-1; ++j) a[j] = a[j+1]; --n;'}
done|  return n;
end|}`);
}
