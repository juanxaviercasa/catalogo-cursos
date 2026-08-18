import type { VideoProcessingSetup } from "@shared/learning";
import { CheckCircle2, CircleDashed, Cloud, Computer, KeyRound, ServerCog } from "lucide-react";

const iconFor = {
  "local-worker": Computer,
  "persistent-worker": ServerCog,
  "managed-provider": Cloud,
};

export function VideoProcessingPanel({ setup }: { setup: VideoProcessingSetup }) {
  return (
    <section className="processing-placeholder" aria-labelledby="processing-placeholder-title">
      <div className="processing-placeholder-head">
        <div className="processing-status-icon"><CircleDashed size={20} /></div>
        <div><span>ESTADO ACTUAL · NO CONFIGURADO</span><h2 id="processing-placeholder-title">Conversión automática aún no activa</h2><p>Los MP4/WebM que ya son reproducibles se conservan. Los MKV y otros formatos no compatibles no se convierten hasta que se configure un procesador real.</p></div>
      </div>
      <div className="pending-service-status"><CircleDashed size={16} /><div><b>Proveedor pendiente de configurar</b><span>Estas tarjetas no son botones y no activan ninguna conversión.</span></div></div>
      <details className="pending-details"><summary>Ver opciones técnicas futuras <span>No activas</span></summary><div className="processing-provider-grid">
          {setup.providers.map((provider) => {
            const Icon = iconFor[provider.id];
            return <article className={`processing-provider processing-provider--${provider.tier}`} aria-disabled="true" key={provider.id}><div><Icon size={18} /><span>{provider.tier === "free" ? "RUTA GRATUITA" : "OPCIONAL"}</span></div><h3>{provider.label}</h3><p>{provider.description}</p><small>{provider.requirement}</small></article>;
          })}
        </div><div className="processing-contract"><div><KeyRound size={16} /><span>Datos que completarás después</span></div><p>No hay credenciales guardadas todavía. Cuando se elija una ruta, estos valores se añadirán como secretos del servidor:</p><div className="processing-keys">{setup.placeholders.map((field) => <code title={field.purpose} key={field.key}>{field.key}<small>{field.example}</small></code>)}</div><div className="processing-storage"><CheckCircle2 size={16} /><span>{setup.storage.description}</span></div></div></details>
    </section>
  );
}
