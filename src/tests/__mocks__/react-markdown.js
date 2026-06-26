// Заглушка react-markdown для Jest: настоящий пакет — ESM и не трансформируется
// CRA-Jest. В тестах markdown не проверяется, поэтому просто отрисовываем текст.
import React from "react";

const ReactMarkdown = ({ children }) => <>{children || null}</>;

export default ReactMarkdown;
