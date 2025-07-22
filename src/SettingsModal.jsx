// src/SettingsModal.jsx

import React from "react";

const options = [
  { key: "appearance", label: "外观" },
  { key: "account", label: "账户" },
  { key: "about", label: "关于" },
];

function SettingsModal({ visible, onClose, nightMode, setNightMode, fontSize, setFontSize }) {
  const [active, setActive] = React.useState("appearance");

  if (!visible) return null;

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <div className="settings-content">
          {/* 左侧菜单 */}
          <div className="settings-menu">
            {options.map(item => (
              <div
                key={item.key}
                className={`settings-menu-item ${active === item.key ? "active" : ""}`}
                onClick={() => setActive(item.key)}
              >
                {item.label}
              </div>
            ))}
          </div>
          {/* 右侧内容 */}
          <div className="settings-detail">
            {active === "appearance" && (
              <>
                <h2>外观设置</h2>
                <label>
                  夜间模式：
                  <input
                    type="checkbox"
                    checked={nightMode}
                    onChange={(e) => setNightMode(e.target.checked)}
                  />
                </label>
                <div>
                  字体大小：
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                  >
                    <option>小</option>
                    <option>中</option>
                    <option>大</option>
                  </select>
                </div>
              </>
            )}
            {active === "account" && (
              <>
                <h2>账户设置</h2>
                <button>微信扫码登录</button>
                {/* 这里可以添加微信扫码登录的逻辑 */}
              </>
            )}
            {active === "about" && (
              <>
                <h2>关于</h2>
                <p>这里是关于本应用的信息。</p>
              </>
            )}
            <button onClick={onClose}>关闭</button>
          </div>
        </div>
      </div>
      {/* 样式建议加在component外部文件或者style标签 */}
      <style>{`
        .settings-modal-overlay {
          position: fixed; 
          top: 0; 
          left: 0; 
          right: 0; 
          bottom: 0;
          background: rgba(0,0,0,0.4); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          z-index: 9999;
        }

        .settings-modal {
          background: #fff;
          border-radius: 20px;
          min-width: 700px;
          max-width: 90vw;
          min-height: 400px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          padding: 0;
          display: flex;
          flex-direction: column;
        }

        .settings-content {
          display: flex;
          height: 100%;
        }

        .settings-menu {
          width: 160px;
          padding: 32px 0 32px 32px;
          border-right: 1px solid #ececec;
          background: #fafafa;
          border-top-left-radius: 20px;
          border-bottom-left-radius: 20px;
          /* 为整个菜单区域添加轻微阴影 */
          box-shadow: 2px 0 8px -4px rgba(0,0,0,0.05);
        }

        .settings-menu-item {
          padding: 12px 18px;
          font-size: 16px;
          color: #555;
          cursor: pointer;
          border-radius: 8px;
          margin-bottom: 12px;
          /* 重要：过渡动画要包含所有变化的属性 */
          transition: all 0.3s ease;
          /* 默认状态也可以有轻微阴影 */
          box-shadow: 0 0 0 0 transparent;
        }

        .settings-menu-item:hover {
          background: #f0f0f0;
          transform: translateX(2px);
        }

        .settings-menu-item.active {
          background: #e0e7ff;
          color: #2d47a5;
          font-weight: bold;
          /* 明显的阴影效果 */
          box-shadow: 
            0 4px 16px 0 rgba(50,76,200,0.15), 
            0 2px 8px 0 rgba(0,0,0,0.10),
            2px 0 12px -2px rgba(50,76,200,0.08);
          position: relative;
          z-index: 2;
          /* 轻微向右移动，增强浮起效果 */
          transform: translateX(4px);
        }

        .settings-detail {
          flex: 1;
          padding: 48px;
          background: #fff;
          border-top-right-radius: 20px;
          border-bottom-right-radius: 20px;
        }

        .settings-detail h2 {
          margin-top: 0;
          color: #333;
          font-size: 24px;
          margin-bottom: 24px;
        }

        /* 为设置项内的表单元素添加样式 */
        .settings-detail label {
          display: block;
          margin-bottom: 16px;
          font-weight: 500;
          color: #555;
        }

        .settings-detail input, 
        .settings-detail select {
          margin-left: 8px;
          padding: 6px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .settings-detail button {
          background: #2d47a5;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 24px;
          transition: background 0.2s ease;
        }

        .settings-detail button:hover {
          background: #1e3a8a;
        }
      `}</style>
    </div>
  );
}

export default SettingsModal;