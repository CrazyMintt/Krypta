import React, { useState } from 'react';
import { Folder, File, MoreVertical, ChevronRight } from 'lucide-react';
import Header from '../layout/Header';

// Mock data para simular uma estrutura de arquivos
const initialFileSystem = {
  '/': [
    { type: 'folder', name: 'Trabalho' },
    { type: 'folder', name: 'Pessoal' },
    { type: 'file', name: 'senha_wifi.txt' },
  ],
  '/Trabalho/': [
    { type: 'file', name: 'relatorio_q3.pdf' },
    { type: 'folder', name: 'Projetos' },
  ],
  '/Trabalho/Projetos/': [
    { type: 'file', name: 'projeto_krypta.docx' },
  ],
  '/Pessoal/': [
    { type: 'file', name: 'lista_compras.txt' },
  ],
};

const Dashboard = ({ openModal }) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState(initialFileSystem[currentPath]);

  const navigateTo = (folderName) => {
    const newPath = `${currentPath}${folderName}/`;
    if (initialFileSystem[newPath]) {
      setCurrentPath(newPath);
      setItems(initialFileSystem[newPath]);
    }
  };

  const navigateBack = (pathIndex) => {
    const pathParts = currentPath.split('/').filter(p => p);
    const newPath = `/${pathParts.slice(0, pathIndex + 1).join('/')}/`;
    if (initialFileSystem[newPath]) {
      setCurrentPath(newPath);
      setItems(initialFileSystem[newPath]);
    }
  };

  const Breadcrumbs = () => {
    const pathParts = currentPath.split('/').filter(p => p);
    return (
      <div className="breadcrumbs">
        <span onClick={() => navigateTo('')}>Raiz</span>
        {pathParts.map((part, index) => (
          <React.Fragment key={index}>
            <ChevronRight size={16} />
            <span onClick={() => navigateBack(index)}>{part}</span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div id="main-content" className="main-content">
      <Header title="Gerenciador de Arquivos" openModal={openModal} />
      <div className="file-manager">
        <Breadcrumbs />
        <div className="file-list">
          {items.map((item, index) => (
            <div key={index} className="file-item" onDoubleClick={() => item.type === 'folder' && navigateTo(item.name)}>
              <div className="file-info">
                {item.type === 'folder' ? <Folder size={20} /> : <File size={20} />}
                <span className="file-name">{item.name}</span>
              </div>
              <div className="file-actions">
                <button><MoreVertical size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;