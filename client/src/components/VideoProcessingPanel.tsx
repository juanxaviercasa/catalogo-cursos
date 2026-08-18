import type { VideoProcessingSetup } from "@shared/learning";
import { CheckCircle2, CircleDashed, Cloud, Computer, KeyRound, ServerCog } from "lucide-react";

const iconFor = {
  "local-worker": Computer,
  "persistent-worker": ServerCog,
  "managed-provider": Cloud,
};

export function VideoProcessingPanel({ setup }: { setup: VideoProcessingSetup }) {
  const isPilotReady = setup.status === "pilot_ready";
  const pendingCount = setup.availability.queued + setup.availability.processing;
  const activeLabel = setup.activeMode === "local-worker" ? "Equipo propio" : setup.activeMode === "persistent-worker" ? "Servicio persistente" : null;
  return (
    <section className="processing-placeholder" aria-labelledby="processing-placeholder-title">
      <div className="processing-placeholder-head">
        <div className="processing-status-icon">{isPilotReady ? <CheckCircle2 size={20} /> : <CircleDashed size={20} />}</div>
        <div><span>{activeLabel ? `RUTA SELECCIONADA · ${activeLabel.toUpperCase()}` : isPilotReady ? "ESTADO ACTUAL · PILOTO LISTO" : "ESTADO ACTUAL · NO CONFIGURADO"}</span><h2 id="processing-placeholder-title">{activeLabel ? `Conversión automática por ${activeLabel.toLowerCase()}` : isPilotReady ? "Conversión MP4 validada" : "Conversión automática aún no activa"}</h2><p>{activeLabel ? `Los MKV nuevos se entregarán automáticamente al ${activeLabel.toLowerCase()} seleccionado; los MP4/WebM válidos se conservan sin conversión.` : isPilotReady ? `El ZIP piloto conserva ${setup.availability.ready - setup.availability.transcoded} vídeo reproducible y convirtió ${setup.availability.transcoded} MKV a MP4. Todos se sirven desde el almacenamiento gestionado.` : "Los MP4/WebM que ya son reproducibles se conservan. Los MKV y otros formatos no compatibles no se convierten hasta que se configure un procesador real."}</p></div>
      </div>
      <div className="pending-service-status">{activeLabel || isPilotReady ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}<div><b>{activeLabel ? `Ruta activa: ${activeLabel}` : isPilotReady ? `${setup.availability.ready} vídeos disponibles` : "Proveedor pendiente de configurar"}</b><span>{activeLabel ? pendingCount ? `${pendingCount} vídeos siguen en cola o conversión.` : "La siguiente importación enviará automáticamente los formatos incompatibles." : isPilotReady ? pendingCount ? `${pendingCount} vídeos siguen en cola o conversión.` : "La automatización para futuros ZIP sigue pendiente de configurar." : "Estas tarjetas no son botones y no activan ninguna conversión."}</span></div></div>
      <details className="pending-details"><summary>Ver opciones técnicas futuras <span>{isPilotReady ? "Pendientes para próximos ZIP" : "No activas"}</span></summary><div className="processing-provider-grid">
          {setup.providers.map((provider) => {
            const Icon = iconFor[provider.id];
            return <article className={`processing-provider processing-provider--${provider.tier} ${setup.activeMode === provider.id ? "processing-provider--active" : ""}`} aria-disabled="true" key={provider.id}><div><Icon size={18} /><span>{setup.activeMode === provider.id ? "SELECCIONADA" : provider.tier === "free" ? "RUTA GRATUITA" : "OPCIONAL"}</span></div><h3>{provider.label}</h3><p>{provider.description}</p><small>{provider.requirement}</small></article>;
          })}
        </div><div className="processing-contract"><div><KeyRound size={16} /><span>Datos que completarás después</span></div><p>No hay credenciales guardadas todavía. Cuando se elija una ruta, estos valores se añadirán como secretos del servidor:</p><div className="processing-keys">{setup.placeholders.map((field) => <code title={field.purpose} key={field.key}>{field.key}<small>{field.example}</small></code>)}</div><div className="processing-storage"><CheckCircle2 size={16} /><span>{setup.storage.description}</span></div></div></details>
    </section>
  );
}
