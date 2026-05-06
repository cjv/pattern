import { Sidebar } from './components/Sidebar';
import { EditorCanvas } from './components/EditorCanvas';
import { TilePreview } from './components/TilePreview';
import './styles.css';

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <main className="workspace">
        <div className="workspace-grid">
          <div className="workspace-cell workspace-cell--editor">
            <div className="workspace-cell-label">Tile</div>
            <EditorCanvas />
          </div>
          <div className="workspace-cell workspace-cell--preview">
            <TilePreview />
          </div>
        </div>
      </main>
    </div>
  );
}
