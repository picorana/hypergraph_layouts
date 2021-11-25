import networkx as nx
import json


if __name__ == "__main__":
    fp = "../inria-collab-g.json"
    output_dir = "inria_egos/"

    with open(fp) as file:
        json_data = json.load(file)

    graph = nx.node_link_graph(json_data)
    # print(graph.nodes())

    group_ids = [n for n, attrs in graph.nodes.data() if attrs["entity_type"] == "node"]
    print(len(group_ids))

    for group_id in group_ids:
        ego = nx.ego_graph(graph, group_id)
        # print(ego)
        ego_json = nx.node_link_data(ego)
        fp = f"{output_dir}ego_{group_id}.json"
        with open(fp, "w+") as f:
            json.dump(ego_json, f)
