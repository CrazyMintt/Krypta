import React, { useState, useRef, useEffect } from 'react';
import { Copy, Edit, MoreVertical, Search, ChevronDown, Folder } from 'lucide-react';
import Header from '../layout/Header';

const Cofre = ({ openModal }) => {
  const [allPasswords, setAllPasswords] = useState([
    { id: 1, name: 'Gmail', email: 'email@gmail.com', color: 'red', vault: 'Cofre 1' },
    { id: 2, name: 'Github', email: 'email@gmail.com', color: 'blue', vault: 'Cofre 1' },
    { id: 3, name: 'Spotify', email: 'email@gmail.com', color: 'purple', vault: 'Cofre 2' },
    { id: 4, name: 'Netflix', email: 'email@gmail.com', color: 'green', vault: 'Cofre 3' },
  ]);

  const [displayedPasswords, setDisplayedPasswords] = useState([]);
  const [showVaultDropdown, setShowVaultDropdown] = useState(false);
  const [selectedVault, setSelectedVault] = useState('Todos os cofres');
  const vaultSelectorRef = useRef(null);

  const vaults = ['Todos os cofres', 'Cofre 1', 'Cofre 2', 'Cofre 3'];

  const toggleVaultDropdown = () => {
    setShowVaultDropdown(!showVaultDropdown);
  };

  const handleVaultSelect = (vault) => {
    setSelectedVault(vault);
    setShowVaultDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vaultSelectorRef.current && !vaultSelectorRef.current.contains(event.target)) {
        setShowVaultDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (selectedVault === 'Todos os cofres') {
      setDisplayedPasswords(allPasswords);
    } else {
      setDisplayedPasswords(allPasswords.filter(password => password.vault === selectedVault));
    }
  }, [selectedVault, allPasswords]);

  const handleCopy = (name) => alert(`Senha de ${name} copiada!`);
  
  const handleEdit = (password) => {
      openModal(password);
    };

  const handleMenu = (name) => alert(`Menu de opções de ${name}`);

  return (
    <>
      <div id="left-panel">
        <div id="vault-selector" onClick={toggleVaultDropdown} ref={vaultSelectorRef}>
          <ChevronDown size={16} /><span>{selectedVault}</span>
          {showVaultDropdown && (
            <div className="vault-dropdown-menu">
              {vaults.map((vault) => (
                <div
                  key={vault}
                  className="vault-dropdown-item"
                  onClick={() => handleVaultSelect(vault)}
                >
                  {vault}
                </div>
              ))}
            </div>
          )}
        </div>
        <div id="search-bar"><Search size={16} /><span>Pesquisar</span></div>
        <div id="tags">
          <div className="tag-title">Tags</div>
          <div className="tag-list">
            <div className="tag" style={{ borderLeftColor: 'red' }}>Email</div>
            <div className="tag" style={{ borderLeftColor: 'blue' }}>Apps</div>
          </div>
        </div>
        <div id="folders">
          <div className="folder-title">Pastas</div>
          <div className="folder-item"><Folder size={16} /><span>Backup</span></div>
        </div>
      </div>

      <div id="main-content">
        <Header title="Meu cofre" openModal={openModal} />
        <div id="password-list">
          {displayedPasswords.map((password) => (
            <div key={password.id} className="password-item" style={{ borderLeftColor: password.color }}>
              <div>
                <div className="password-name">{password.name}</div>
                <div className="password-email">{password.email}</div>
              </div>
              <div className="password-actions">
                <button onClick={(e) => { e.stopPropagation(); handleCopy(password.name); }}><Copy size={16} /></button>
                <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(password);
                    }}
                  >
                    <Edit size={16} />
                  </button>
                <button onClick={(e) => { e.stopPropagation(); handleMenu(password.name); }}><MoreVertical size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Cofre;