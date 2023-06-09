import React, { useState } from "react";
import "../styles/App.css";
import NNChart from "./NNChart";

const relationColors = {
  Noun: "#FFC300",
  Organization: "#FF5733",
  Acronym: "#C70039",
  Event: "#900C3F",
  Industry: "#581845",
  Profession: "#001F3F",
  Year: "#0074D9",
};

const App = () => {
  const nodes = [
    { id: "1", label: "show", relation: "Noun", position: [-8, 2, 45] },
    { id: "2", label: "return", relation: "Noun", position: [-6, 2, 67] },
    { id: "3", label: "Covid-19", relation: "Noun", position: [-4, 100, 90] },
    { id: "4", label: "disruption", relation: "Noun", position: [-2, 18, 10] },
    { id: "5", label: "June", relation: "Noun", position: [10, 10, 56] },
    { id: "6", label: "Los Angeles", relation: "Noun", position: [7, 10, 8] },
    {
      id: "7",
      label: "Entertainment Software Association",
      relation: "Organization",
      position: [4, 6, 0],
    },
    { id: "8", label: "ESA", relation: "Acronym", position: [6, 9, 0] },
    {
      id: "9",
      label: "Reedpop",
      relation: "Organization",
      position: [8, 3, 8],
    },
    {
      id: "10",
      label: "video game Christmas",
      relation: "Event",
      position: [10, 7, 7],
    },
    { id: "11", label: "E3", relation: "Event", position: [12, 0, 0] },
    {
      id: "12",
      label: "games industry",
      relation: "Industry",
      position: [14, 0, 0],
    },
    { id: "13", label: "calendar", relation: "Noun", position: [16, 5, 6] },
    { id: "14", label: "1995", relation: "Year", position: [18, 9, 8] },
    {
      id: "15",
      label: "game publishers",
      relation: "Profession",
      position: [20, 0, 0],
    },
    {
      id: "16",
      label: "console manufacturers",
      relation: "Profession",
      position: [22, 0, 0],
    },
    { id: "17", label: "players", relation: "Noun", position: [24, 0, 0] },
  ];

  const edges = [
    { source: "1", target: "2" },
    { source: "2", target: "3" },
    { source: "3", target: "4" },
    { source: "4", target: "5" },
    { source: "5", target: "6" },
    { source: "6", target: "7" },
    { source: "7", target: "8" },
    { source: "8", target: "9" },
    { source: "9", target: "10" },
    { source: "10", target: "11" },
    { source: "11", target: "12" },
    { source: "12", target: "13" },
    { source: "13", target: "14" },
    { source: "14", target: "15" },
    { source: "15", target: "16" },
    { source: "16", target: "17" },
  ];

  const [filters, setFilters] = useState({
    Noun: true,
    Organization: true,
    Acronym: true,
    Event: true,
    Industry: true,
    Profession: true,
    Year: true,
  });

  const handleFilterChange = (relation) => {
    setFilters({
      ...filters,
      [relation]: !filters[relation],
    });
  };

  const [labelScale, setLabelScale] = useState(1);

  const handleScaleChange = (delta) => {
    setLabelScale((prevScale) => Math.max(0.5, prevScale + delta));
  };

  const filteredNodes = nodes.filter((node) => filters[node.relation]);
  return (
    <div className="App">
      <div className="filter-panel">
        {Object.keys(filters).map((relation) => (
          <div className="filter-item" key={relation}>
            <input
              type="checkbox"
              checked={filters[relation]}
              onChange={() => handleFilterChange(relation)}
            />
            <span
              className="filter-label"
              style={{ color: relationColors[relation] }}
            >
              {relation}
            </span>
          </div>
        ))}
        <div className="scale-buttons">
          <button onClick={() => handleScaleChange(-0.1)}>
            {"- (zoom out)"}
          </button>
          <button onClick={() => handleScaleChange(0.1)}>
            {"+ (zoom in)"}
          </button>
        </div>
      </div>
      <NNChart nodes={filteredNodes} edges={edges} labelScale={labelScale} />
    </div>
  );
};

export default App;
