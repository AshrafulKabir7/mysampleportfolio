import { builds, buildsIntro } from "@/content/site";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { FeaturedCard } from "@/components/builds/FeaturedCard";
import { BuildIndex } from "@/components/builds/BuildIndex";
import { cn } from "@/lib/cn";

/** Asymmetric editorial rhythm on lg: 7·5 / 5·7 */
const SPANS = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];

export function Builds() {
  const featured = builds.filter((b) => b.featured);
  const more = builds.filter((b) => !b.featured);

  return (
    <section id="builds" aria-labelledby="builds-title" className="container-page section-pad">
      <SectionHeader
        index="02"
        label="Builds"
        headingId="builds-title"
        title={[{ text: buildsIntro.title }, { text: buildsIntro.emphasis, em: true }]}
        intro={buildsIntro.body}
      />

      <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
        {featured.map((b, i) => (
          <Reveal key={b.slug} amount={0.15} delay={(i % 2) * 0.08} className={cn("min-w-0", SPANS[i % SPANS.length])}>
            <FeaturedCard build={b} index={i + 1} total={builds.length} />
          </Reveal>
        ))}
      </div>

      <BuildIndex items={more} startIndex={featured.length} />
    </section>
  );
}
