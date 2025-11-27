export const ClientsPage = () => {
  return (
    <div className="page">
      <h1>Clientes</h1>
      <form>
        <div className="section">
          <label>
            <span>Nombre</span>
            <input type="text" />
          </label>
          <label>
            <span>RIF</span>
            <input type="text" />
          </label>
          <label>
            <span>Dirección</span>
            <input type="text" />
          </label>
          <button>Agregar cliente</button>
        </div>
      </form>
    </div>
  );
};
