// App.tsx
import { ChatPage } from "./ChatPage";
import { HistoryPage } from "./HistoryPage";
import "./index.css";
import { useState, useEffect } from "react";
import axios from "axios";
import SettingsModal from "./SettingsModal";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_API_KEY = "sk-4c5e3f379f834aa197fec3834a8c9b07";

export function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [nightMode, setNightMode] = useState(
    localStorage.getItem("nightMode") === "true"
  );
  const [evaluationCriteria, setEvaluationCriteria] = useState({
     "text": {
      "criteria": "The title should be concise, precise, and accurately reflect the academic topic; main content must be clear, rigorous, and logically structured, using proper headings and well-distinguished levels. Avoid colloquialism, ensure high relevance to the academic subject, and support key points with evidence or clear referencing where necessary. Use consistent and readable font sizes, styles, and colors; text should include appropriate academic terminology and, if relevant, proper citations.",
      "scale": 5
    },
    "image": {
      "criteria": "Images and charts must be high quality (clear, no distortion, watermarks, or unnecessary borders), appropriately sized, and scientifically relevant to the topic. Images should enhance or explain the academic content (e.g., research data, diagrams, statistical figures). Each image or chart should have a concise title or caption and clearly indicate the data source if applicable. The layout must align with the page style and maintain an academic tone. No penalty for slides without images.",
      "scale": 5
    },
    "layout": {
      "criteria": "All elements (text, images, formulas, icons, tables) should be well-aligned, evenly spaced, and entirely within slide boundaries. The hierarchy of content must be clear, enabling easy comprehension of the academic argument or logic. Ensure proper use of white space to avoid overcrowding. The visual focus should highlight key points or findings, supporting natural reading flow. Follow academic or institutional template standards if available.",
      "scale": 5
    },
    "color": {
      "criteria": "Use high-contrast color specifically between text and background to ensure legibility. Avoid overly bright or saturated colors; color schemes should be professional and suitable for academic conferences. Charts and diagrams should use distinguishable colors for different data sets and be considerate of color accessibility (e.g., colorblind-safe). Highlight important information subtly without disrupting the academic style.",
      "scale": 5
    },
  });
  const [shouldClear, setShouldClear] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState("home");
  const [showSlidev, setShowSlidev] = useState(false);
  const [messages, setMessages] = useState<
    { sender: "user" | "ai"; text: string; fileUrl?: string; fileType?: string }[]
  >([]);
  const [fromHistory, setFromHistory] = useState(false);

  useEffect(() => {
    localStorage.setItem("nightMode", nightMode.toString());
    document.body.classList.toggle("night-mode", nightMode);
  }, [nightMode]);

  useEffect(() => {
    handleSidebarItemClick("home");
  }, []);

  const generateNewCriteria = async (prompt: string) => {
    try {
      const response = await axios.post(
        DEEPSEEK_API_URL,
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "user",
              content: `你是一个精准的幻灯片评估标准生成器，当前的评估标准如下：${JSON.stringify(
                evaluationCriteria,
                null,
                2
              )}，如果用户无要求，返回默认评估标准;如果用户有要求,你负责根据一下用户需求调整默认评估标准(发生冲突时用户要求优先级更高),并以JSON格式返回评估标准,仅包含text、image、layout、color四个方面,每个方面包含criteria和scale(scale是一个单独的数值)：${prompt}`,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          },
        }
      );

      if (response.status === 200) {
        if (response.data && response.data.choices && response.data.choices.length > 0) {
          const content = response.data.choices[0].message.content;
          console.log("API 返回的内容:", content);
          try {
            const jsonStart = content.indexOf("{");
            const jsonEnd = content.lastIndexOf("}");
            if (jsonStart !== -1 && jsonEnd !== -1) {
              const jsonContent = content.slice(jsonStart, jsonEnd + 1);
              const newCriteria = JSON.parse(jsonContent);
              const filteredCriteria = {
                text: newCriteria.text || evaluationCriteria.text,
                image: newCriteria.image || evaluationCriteria.image,
                layout: newCriteria.layout || evaluationCriteria.layout,
                color: newCriteria.color || evaluationCriteria.color,
              };
              setEvaluationCriteria(filteredCriteria);
              console.log("API 请求成功，新的评估标准已更新:", newCriteria);
              for (const [name, { criteria, scale }] of Object.entries(newCriteria)) {
                await axios.post("/api/update_metric", { name, criteria, scale });
              }
            } else {
              console.error("未找到有效的 JSON 数据");
            }
          } catch (jsonError) {
            console.error("解析 JSON 时出错:", jsonError);
          }
        } else {
          console.error("API 返回的数据格式不符合预期:", response.data);
        }
      } else {
        console.error("API 请求失败，状态码:", response.status);
      }
    } catch (error) {
      console.error("生成新的评估标准时出错:", error);
    }
  };

  const handleNewConversation = () => {
    setShouldClear(true);
    setActiveSidebarItem("home");
    setFromHistory(false);
  };

  const handleSidebarItemClick = (itemKey: string) => {
    if (itemKey === "newConversation") {
      handleNewConversation();
    } else {
      setActiveSidebarItem(itemKey);
      setFromHistory(itemKey === "home" && activeSidebarItem === "history");
      if (itemKey === "home") {
        setShowSlidev(false); // 关闭 iframe-container
      }
    }
  };

  const handleOpenSlidev = () => {
    setShowSlidev(true);
  };

  const handleSelectConversation = (conversationMessages: any[]) => {
    setMessages(conversationMessages);
    setActiveSidebarItem("home");
    setFromHistory(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
    setActiveSidebarItem("home");
  };

  return (
    <div className="app" style={{ height: "100vh", display: "flex" }}>
      <div className="sidebar">
        <div
          className={`sidebar-item ${activeSidebarItem === "home" ? "active" : ""}`}
          onClick={() => handleSidebarItemClick("home")}
        >
          <i className="fa-solid fa-house"></i>
          <span>主页</span>
        </div>
        <div
          className="sidebar-item"
          onClick={() => handleSidebarItemClick("newConversation")}
        >
          <i className="fa-solid fa-plus"></i>
          <span>新会话</span>
        </div>
        <div
          className={`sidebar-item ${activeSidebarItem === "history" ? "active" : ""}`}
          onClick={() => handleSidebarItemClick("history")}
        >
          <i className="fa-solid fa-clock"></i>
          <span>历史会话</span>
        </div>
        <div
          className={`sidebar-item ${activeSidebarItem === "settings" ? "active" : ""}`}
          onClick={() => {
            handleSidebarItemClick("settings");
            setShowSettings(true);
          }}
        >
          <i className="fa-solid fa-gear"></i>
          <span>设置</span>
        </div>
        <div
          className={`sidebar-item ${activeSidebarItem === "slidev" ? "active" : ""}`}
          onClick={() => {
            handleSidebarItemClick("slidev");
            handleOpenSlidev();
          }}
        >
          <i className="fa-solid fa-slideshare"></i>
          <span>Slidev 页面</span>
        </div>
      </div>
      {showSettings && (
        <SettingsModal
          visible={showSettings}
          onClose={handleCloseSettings}
          nightMode={nightMode}
          setNightMode={setNightMode}
        />
      )}
      <div className="main-content">
        <header
          className="header"
          style={{
            position: "fixed",
            top: 0,
            left: "60px",
            right: 0,
            display: "flex",
            alignItems: "center",
            padding: "10px",
            backgroundColor: "white",
            zIndex: 2,
          }}
        ></header>
        {activeSidebarItem === "history" ? (
          <HistoryPage
            onSelectConversation={handleSelectConversation}
            onBack={() => setActiveSidebarItem("home")}
          />
        ) : (
          <ChatPage
            evaluationCriteria={evaluationCriteria}
            generateNewCriteria={generateNewCriteria}
            shouldClear={shouldClear}
            onClearComplete={() => setShouldClear(false)}
            showSlidev={showSlidev}
            setShowSlidev={setShowSlidev}
            messages={messages}
            setMessages={setMessages}
            fromHistory={fromHistory}
            setActiveSidebarItem={setActiveSidebarItem}
          />
        )}
      </div>
    </div>
  );
}

export default App;