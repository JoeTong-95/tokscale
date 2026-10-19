import { Navigation } from "@/components/layout/Navigation";
import { ServiceFooter } from "@/components/layout/ServiceFooter";
import { ModelNotFound } from "@/components/explore/ModelNotFound";

export default function ModelNotFoundPage() {
  return (
    <div className="service-page-shell">
      <Navigation />
      <main className="service-main" id="main-content">
        <ModelNotFound />
      </main>
      <ServiceFooter />
    </div>
  );
}
