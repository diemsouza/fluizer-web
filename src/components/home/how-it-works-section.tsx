"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HOW_IT_WORKS_AUTOSCROLL_MS } from "@/src/lib/constants";
import { useCarouselAutoscroll } from "@/src/hooks/use-carousel-autoscroll";
import { cn } from "@/src/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/src/components/ui/carousel";

const BLOCK_COUNT = 6;
const IMAGE_WIDTH = 960;
const IMAGE_HEIGHT = 540;

export default function HowItWorksSection() {
  const t = useTranslations("home.how_it_works");
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { sectionRef, onUserHover } = useCarouselAutoscroll({
    api,
    intervalMs: HOW_IT_WORKS_AUTOSCROLL_MS,
  });

  useEffect(() => {
    if (!api) return;
    const syncIndex = (): void => setSelectedIndex(api.selectedScrollSnap());
    syncIndex();
    api.on("select", syncIndex);
    return () => {
      api.off("select", syncIndex);
    };
  }, [api]);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="section-dark py-[120px] px-6 md:py-[80px] scroll-mt-24"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-[28px] sm:text-[34px] md:text-[38px] font-normal leading-tight mb-4">
            {t("title")}
          </h2>
          <p className="text-[17px] text-muted-foreground max-w-xl mx-auto leading-[1.7]">
            {t("subtitle")}
          </p>
        </div>

        <Carousel
          opts={{ loop: true }}
          setApi={setApi}
          className="px-4"
          onMouseEnter={onUserHover}
        >
          <CarouselContent>
            {Array.from({ length: BLOCK_COUNT }, (_, i) => (
              <CarouselItem key={i}>
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                  <div className="flex-1 order-2 md:order-1">
                    <h3 className="text-2xl font-[600] mb-3">
                      {t(`blocks.${i}.title`)}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t(`blocks.${i}.description`)}
                    </p>
                  </div>
                  <div className="flex-1 order-1 md:order-2 w-full">
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/images/how-it-works/${i}.webp`}
                        alt={t(`blocks.${i}.image_alt`)}
                        width={IMAGE_WIDTH}
                        height={IMAGE_HEIGHT}
                        loading={i === 0 ? "eager" : "lazy"}
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            type="button"
            aria-label={t("previous")}
            onClick={() => api?.scrollPrev()}
            className="touch-target text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            {Array.from({ length: BLOCK_COUNT }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={t("go_to_slide", { n: i + 1 })}
                onClick={() => api?.scrollTo(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === selectedIndex
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted-foreground/30",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label={t("next")}
            onClick={() => api?.scrollNext()}
            className="touch-target text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
