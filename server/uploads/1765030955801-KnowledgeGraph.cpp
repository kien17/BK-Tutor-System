#include "KnowledgeGraph.h"

// Helper to convert a string vertex to its string representation
static string vertexStringify(string &s) { return s; }

// =============================================================================
// Class Edge Implementation
// =============================================================================

template <class T>
Edge<T>::Edge(VertexNode<T> *from, VertexNode<T> *to, float weight)
{
    this->from = from;
    this->to = to;
    this->weight = weight;
}

template <class T>
string Edge<T>::toString()
{
    string fromStr = "";
    string toStr = "";
    if (from != nullptr && from->vertex2str != nullptr)
        fromStr = from->vertex2str(from->getVertex());
    if (to != nullptr && to->vertex2str != nullptr)
        toStr = to->vertex2str(to->getVertex());

    // Format weight: if it's whole number, print without decimal point
    std::stringstream ss;
    if (std::floor(weight) == weight) {
        ss << static_cast<int>(weight);
    } else {
        ss << weight;
    }

    return string("E(") + fromStr + "," + toStr + "," + ss.str() + ")";
}

// TODO: Implement other methods of Edge:
template <class T>
bool Edge<T>::equals(Edge<T> *edge) {
    if (edge == nullptr) return false;

    return this->from->equals(edge->from) && this->to->equals(edge->to);
}

template <class T>
bool Edge<T>::edgeEQ(Edge<T> *&edge1, Edge<T> *&edge2) {
    if (edge1 == nullptr && edge2 == nullptr) return true;
    if (edge1 == nullptr || edge2 == nullptr) return false;

    return edge1->from->equals(edge2->from) && edge1->to->equals(edge2->to);
}

// =============================================================================
// Class VertexNode Implementation
// =============================================================================

template <class T>
VertexNode<T>::VertexNode(T vertex, bool (*vertexEQ)(T &, T &), string (*vertex2str)(T &))
{
    this->vertex = vertex;
    this->vertexEQ = vertexEQ;
    this->vertex2str = vertex2str;
    this->inDegree_ = 0;
    this->outDegree_ = 0;
}

template <class T>
VertexNode<T>::~VertexNode()
{
    for (auto e : adList) {
        delete e;
    }
    adList.clear();
}

template <class T>
void VertexNode<T>::connect(VertexNode<T> *to, float weight)
{
    Edge<T>* existing = getEdge(to);
    if (existing != nullptr) {
        existing->weight = weight;
        return;
    }

    adList.push_back(new Edge<T>(this, to, weight));
    outDegree_++;
    if (to != nullptr) to->inDegree_++;
}

template <class T>
Edge<T> *VertexNode<T>::getEdge(VertexNode<T> *to) {
    if (to == nullptr) {
        return nullptr;
    }

    for (Edge<T> *edge : this->adList) {
        if (edge->to->equals(to)) {
            return edge;
        }
    }

    return nullptr;
}

template <class T>
bool VertexNode<T>::equals(VertexNode<T> *node) {
    if (node == nullptr) return false;

    if (this->vertexEQ != nullptr) {
        return this->vertexEQ(this->vertex, node->vertex);
    } 
    else {
        return this->vertex == node->vertex;
    }
}

template <class T>
void VertexNode<T>::removeTo(VertexNode<T> *to) {
    for (auto it = adList.begin(); it != adList.end(); ++it) {
        if ((*it)->to->equals(to)) {
            // delete the Edge object to avoid memory leak
            delete *it;
            adList.erase(it);
            outDegree_--;
            return;
        }
    }
}

template <class T>
int VertexNode<T>::inDegree() {
    return inDegree_;
}

template <class T>
int VertexNode<T>::outDegree() {
    return outDegree_;
}

template <class T>
T &VertexNode<T>::getVertex() {
    return vertex;
}

template <class T>
string VertexNode<T>::toString() {
    string vStr = "";
    if (vertex2str != nullptr) vStr = vertex2str(vertex);
    stringstream ss;
    ss << "V(" << vStr << ", in: " << inDegree_ << ", out: " << outDegree_ << ")";
    return ss.str();
}

// =============================================================================
// Class DGraphModel Implementation
// =============================================================================

template <class T>
DGraphModel<T>::DGraphModel(bool (*vertexEQ)(T &, T &), string (*vertex2str)(T &))
{
    this->vertexEQ = vertexEQ;
    this->vertex2str = vertex2str;
}

template <class T>
DGraphModel<T>::~DGraphModel()
{
    // TODO: Clear all vertices and edges to avoid memory leaks
    clear();
}

template <class T>
void DGraphModel<T>::add(T vertex)
{
    // Add a new vertex to the graph
    nodeList.push_back(new VertexNode<T>(vertex, vertexEQ, vertex2str));
}

template <class T>
void DGraphModel<T>::connect(T from, T to, float weight)
{
    // TODO: Connect two vertices 'from' and 'to'
    for (auto nodeFrom : nodeList) {
        if ((vertexEQ != nullptr && vertexEQ(nodeFrom->getVertex(), from)) ||
            (vertexEQ == nullptr && nodeFrom->getVertex() == from)) {
            for (auto nodeTo : nodeList) {
                if ((vertexEQ != nullptr && vertexEQ(nodeTo->getVertex(), to)) ||
                    (vertexEQ == nullptr && nodeTo->getVertex() == to)) {
                    nodeFrom->connect(nodeTo, weight);
                    return;
                }
            }
            throw VertexNotFoundException();
        }
    }

    throw VertexNotFoundException();
}

template <class T>
VertexNode<T> *DGraphModel<T>::getVertexNode(T &vertex) {
    for (auto node : nodeList) {
        if ((vertexEQ != nullptr && vertexEQ(node->getVertex(), vertex)) ||
            (vertexEQ == nullptr && node->getVertex() == vertex)) {
            return node;
        }
    }
    return nullptr;
}

template <class T>
bool DGraphModel<T>::contains(T vertex) {
    return getVertexNode(vertex) != nullptr;
}

template <class T>
float DGraphModel<T>::weight(T from, T to) {
    VertexNode<T> *nodeFrom = getVertexNode(from);
    VertexNode<T> *nodeTo = getVertexNode(to);

    if (nodeFrom == nullptr || nodeTo == nullptr) {
        throw VertexNotFoundException();
    }

    Edge<T> *edge = nodeFrom->getEdge(nodeTo);
    if (edge == nullptr) {
        throw EdgeNotFoundException();
    }

    return edge->weight;
}

template <class T>
bool DGraphModel<T>::connected(T from, T to) {
    VertexNode<T> *nodeFrom = getVertexNode(from);
    VertexNode<T> *nodeTo = getVertexNode(to);

    if (nodeFrom == nullptr || nodeTo == nullptr) {
        throw VertexNotFoundException();
    }

    Edge<T> *edge = nodeFrom->getEdge(nodeTo);
    return edge != nullptr;
}

template <class T>
int DGraphModel<T>::size() {
    return nodeList.size();
}

template <class T>
bool DGraphModel<T>::empty() {
    return nodeList.empty();
}

template <class T>
int DGraphModel<T>::inDegree(T vertex) {
    VertexNode<T> *node = getVertexNode(vertex);
    if (node == nullptr) {
        string vStr;
        if (vertex2str != nullptr) vStr = vertex2str(vertex);
        else {
            stringstream tmp; tmp << vertex; vStr = tmp.str();
        }
        throw VertexNotFoundException(string("Vertex (") + vStr + "): is not found");
    }
    return node->inDegree();
}

template <class T>
int DGraphModel<T>::outDegree(T vertex) {
    VertexNode<T> *node = getVertexNode(vertex);
    if (node == nullptr) {
        string vStr;
        if (vertex2str != nullptr) vStr = vertex2str(vertex);
        else {
            stringstream tmp; tmp << vertex; vStr = tmp.str();
        }
        throw VertexNotFoundException(string("Vertex (") + vStr + "): is not found");
    }
    return node->outDegree();
}

template <class T>
vector<T> DGraphModel<T>::getOutwardEdges(T from) {
    VertexNode<T> *nodeFrom = getVertexNode(from);
    if (nodeFrom == nullptr) {
        throw VertexNotFoundException();
    }

    vector<T> outwardEdges;
    for (Edge<T> *edge : nodeFrom->adList) {
        outwardEdges.push_back(edge->to->getVertex());
    }
    return outwardEdges;
}

template <class T>
vector<T> DGraphModel<T>::vertices() {
    vector<T> verticesList;
    for (auto node : nodeList) {
        verticesList.push_back(node->getVertex());
    }
    return verticesList;
}

template <class T>
string DGraphModel<T>::vertex2Str(VertexNode<T> &node) {
    return vertex2str != nullptr ? vertex2str(node.getVertex()) : "";
}

template <class T>
string DGraphModel<T>::edge2Str(Edge<T> &edge) {
    string fromStr = vertex2str != nullptr ? vertex2str(edge.from->getVertex()) : "";
    string toStr = vertex2str != nullptr ? vertex2str(edge.to->getVertex()) : "";
    return fromStr + " -> " + toStr + " (weight: " + std::to_string(edge.weight) + ")";
}

template <class T>
string DGraphModel<T>::toString() {
    stringstream ss;
    ss << "==================================================\n";
    ss << "Vertices:\n";
    for (auto node : nodeList) {
        ss << node->toString() << "\n";
    }
    ss << "------------------------------\n";
    ss << "Edges:\n";
    for (auto node : nodeList) {
        for (auto edge : node->adList) {
            ss << edge->toString() << "\n";
        }
    }
    ss << "==================================================\n";
    return ss.str();
}

template <class T>
void DGraphModel<T>::clear() {
    for (auto node : nodeList) {
        delete node;
    }
    nodeList.clear();
}

template <class T>
void DGraphModel<T>::disconnect(T from, T to) {
    VertexNode<T> *nodeFrom = getVertexNode(from);
    VertexNode<T> *nodeTo = getVertexNode(to);

    if (nodeFrom == nullptr || nodeTo == nullptr) {
        throw VertexNotFoundException();
    }

    Edge<T> *edge = nodeFrom->getEdge(nodeTo);
    if (edge == nullptr) {
        throw EdgeNotFoundException();
    }

    nodeFrom->removeTo(nodeTo);
    nodeTo->inDegree_--;
}
// TODO: Implement other methods of DGraphModel:
// TODO: BFS use Queue and DFS use stack
template <class T>
class Queue
{
private:
    vector<T> data;
    int frontIndex;
    int rearIndex;

public:
    Queue() : frontIndex(0), rearIndex(-1) {}
    void push(const T &val) {
        data.push_back(val);
        rearIndex = (int)data.size() - 1;
    }

    void pop() {
        if (!empty()) {
            frontIndex++;
            // compact occasionally
            if (frontIndex > 64 && frontIndex * 2 > (int)data.size()) {
                data.erase(data.begin(), data.begin() + frontIndex);
                rearIndex = (int)data.size() - 1;
                frontIndex = 0;
            }
        }
    }

    T front() {
        return data[frontIndex];
    }

    bool empty() const {
        return frontIndex >= (int)data.size();
    }
};
template <class T>
class Stack
{
private:
    vector<T> data;

public:
    Stack() = default;
    void push(const T &val) { data.push_back(val); }
    void pop() { if (!data.empty()) data.pop_back(); }
    T top() { return data.back(); }
    bool empty() const { return data.empty(); }
};

template <class T>
string DGraphModel<T>::BFS(T start) {
    T key = start;
    VertexNode<T>* startNode = getVertexNode(key);
    if (startNode == nullptr) throw VertexNotFoundException();

    Queue<VertexNode<T>*> q;
    vector<VertexNode<T>*> visited;
    vector<string> order;

    auto isVisited = [&](VertexNode<T>* n) {
        for (auto v : visited) if (v == n) return true;
        return false;
    };

    q.push(startNode);
    visited.push_back(startNode);

    while (!q.empty()) {
        VertexNode<T>* node = q.front(); q.pop();
        order.push_back(vertex2Str(*node));

        for (Edge<T>* e : node->adList) {
            VertexNode<T>* to = e->to;
            if (!isVisited(to)) {
                visited.push_back(to);
                q.push(to);
            }
        }
    }

    // join with single space
    stringstream ss;
    for (size_t i = 0; i < order.size(); ++i) {
        if (i) ss << " ";
        ss << order[i];
    }
    return ss.str();
}

template <class T>
string DGraphModel<T>::DFS(T start) {
    T key = start;
    VertexNode<T>* startNode = getVertexNode(key);
    if (startNode == nullptr) throw VertexNotFoundException();

    Stack<VertexNode<T>*> st;
    vector<VertexNode<T>*> visited;
    vector<string> order;

    auto isVisited = [&](VertexNode<T>* n) {
        for (auto v : visited) if (v == n) return true;
        return false;
    };

    st.push(startNode);

    while (!st.empty()) {
        VertexNode<T>* node = st.top(); st.pop();
        if (isVisited(node)) continue;
        visited.push_back(node);
        order.push_back(vertex2Str(*node));

        // push neighbors in reverse insertion order so first neighbor is processed first
        for (auto it = node->adList.rbegin(); it != node->adList.rend(); ++it) {
            VertexNode<T>* to = (*it)->to;
            if (!isVisited(to)) {
                st.push(to);
            }
        }
    }

    stringstream ss;
    for (size_t i = 0; i < order.size(); ++i) {
        if (i) ss << " ";
        ss << order[i];
    }
    return ss.str();
}

// =============================================================================
// Class KnowledgeGraph Implementation
// =============================================================================

KnowledgeGraph::KnowledgeGraph() {
    graph = DGraphModel<string>(nullptr, vertexStringify);
}

void KnowledgeGraph::addEntity(string entity) {
    if (graph.contains(entity)) {
        throw EntityExistsException();
    }

    graph.add(entity);
    entities.push_back(entity);
}

void KnowledgeGraph::addRelation(string from, string to, float weight) {
    if (!graph.contains(from) || !graph.contains(to)) {
        throw EntityNotFoundException();
    }

    graph.connect(from, to, weight);
}

// TODO: Implement other methods of KnowledgeGraph:

vector<string> KnowledgeGraph::getAllEntities() {
    return entities;
}

vector<string> KnowledgeGraph::getNeighbors(string entity) {
    if (!graph.contains(entity)) throw EntityNotFoundException();
    return graph.getOutwardEdges(entity);
}

string KnowledgeGraph::bfs(string start) {
    if (!graph.contains(start)) throw EntityNotFoundException();
    return graph.BFS(start);
}

string KnowledgeGraph::dfs(string start) {
    if (!graph.contains(start)) throw EntityNotFoundException();
    return graph.DFS(start);
}

bool KnowledgeGraph::isReachable(string from, string to) {
    if (!graph.contains(from) || !graph.contains(to)) throw EntityNotFoundException();

    vector<string> q;
    size_t qi = 0;
    q.push_back(from);
    vector<string> visited;
    visited.push_back(from);

    while (qi < q.size()) {
        string cur = q[qi++];
        if (cur == to) return true;
        vector<string> neigh = graph.getOutwardEdges(cur);
        for (auto &n : neigh) {
            bool seen = false;
            for (auto &v : visited) if (v == n) { seen = true; break; }
            if (!seen) { visited.push_back(n); q.push_back(n); }
        }
    }

    return false;
}

string KnowledgeGraph::toString() {
    return graph.toString();
}

vector<string> KnowledgeGraph::getRelatedEntities(string entity, int depth) {
    if (!graph.contains(entity)) throw EntityNotFoundException();

    vector<string> related;
    vector<string> visited;
    vector<string> q;
    size_t qi = 0;

    visited.push_back(entity);
    q.push_back(entity);

    int currentDepth = 0;
    while (qi < q.size() && currentDepth < depth) {
        size_t levelEnd = q.size(); // nodes in current level are [qi, levelEnd)
        while (qi < levelEnd) {
            string cur = q[qi++];
            vector<string> neigh = graph.getOutwardEdges(cur);
            for (auto &n : neigh) {
                bool seen = false;
                for (auto &v : visited) if (v == n) { seen = true; break; }
                if (!seen) {
                    visited.push_back(n);
                    related.push_back(n);
                    q.push_back(n);
                }
            }
        }
        currentDepth++;
    }

    return related;
}

static int shortestDistance(DGraphModel<string> &g, const string &s, const string &t) {
    if (s == t) return 0;
    if (!g.contains(s) || !g.contains(t)) return -1;

    vector<string> q;
    size_t qi = 0;
    q.push_back(s);
    vector<string> distVertex;
    vector<int> dist;
    dist.push_back(0);

    while (qi < q.size()) {
        string cur = q[qi];
        int curd = dist[qi];
        qi++;
        vector<string> neigh = g.getOutwardEdges(cur);
        for (auto &n : neigh) {
            bool seen = false;
            for (size_t i = 0; i < q.size(); ++i) if (q[i] == n) { seen = true; break; }
            if (!seen) {
                if (n == t) return curd + 1;
                q.push_back(n);
                dist.push_back(curd + 1);
            }
        }
    }

    return -1;
}

string KnowledgeGraph::findCommonAncestors(string entity1, string entity2) {
    if (!graph.contains(entity1) || !graph.contains(entity2)) throw EntityNotFoundException();

    auto collectAncestors = [&](const string &target) {
        vector<string> ancestors;
        vector<string> q;
        size_t qi = 0;
        q.push_back(target);
        while (qi < q.size()) {
            string cur = q[qi++];
            vector<string> allv = graph.vertices();
            for (auto &v : allv) {
                if (v == cur) continue;
                try {
                    if (graph.connected(v, cur)) {
                        bool seen = false;
                        for (auto &a : ancestors) if (a == v) { seen = true; break; }
                        if (!seen) {
                            ancestors.push_back(v);
                            q.push_back(v);
                        }
                    }
                } catch (...) {
                    // ignore
                }
            }
        }
        return ancestors;
    };

    vector<string> anc1 = collectAncestors(entity1);
    vector<string> anc2 = collectAncestors(entity2);

    vector<string> common;
    for (auto &a : anc1) {
        for (auto &b : anc2) {
            if (a == b) { common.push_back(a); break; }
        }
    }

    if (common.empty()) return string("No common ancestor");

    string best = common[0];
    int bestScore = INT32_MAX;
    for (auto &c : common) {
        int d1 = shortestDistance(graph, c, entity1);
        int d2 = shortestDistance(graph, c, entity2);
        if (d1 < 0 || d2 < 0) continue;
        int score = d1 + d2;
        if (score < bestScore) {
            bestScore = score;
            best = c;
        }
    }

    if (bestScore == INT32_MAX) return string("No common ancestor");
    return best;
}



// =============================================================================
// Explicit Template Instantiation
// =============================================================================

template class Edge<string>;
template class Edge<int>;
template class Edge<float>;
template class Edge<char>;

template class VertexNode<string>;
template class VertexNode<int>;
template class VertexNode<float>;
template class VertexNode<char>;

template class DGraphModel<string>;
template class DGraphModel<int>;
template class DGraphModel<float>;
template class DGraphModel<char>;