import type { ReactNode } from "react";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="
        min-h-screen
        w-full
        bg-muted/30
        flex
        items-center
        justify-center
        p-4
        sm:p-6
        lg:p-8
      "
    >
      {/* =========================================================
          MAIN AUTHENTICATION CONTAINER
      ========================================================= */}
      <div
        className="
          mx-auto
          flex
          min-h-[80vh]
          min-h-[560px]
          w-full
          max-w-7xl
          overflow-hidden
          rounded-3xl
          border
          border-primary/20
          bg-background
          shadow-[0_25px_80px_rgba(0,0,0,0.10)]
        "
      >
        {/* =======================================================
            BRAND PANEL
        ======================================================= */}
        <aside
          className="
            relative
            hidden
            overflow-hidden
            border-r
            border-white/30
            bg-sidebar
            text-primary-foreground
            lg:flex
            lg:w-[44%]
            flex-col
            justify-between
            p-10
            xl:p-14
          "
        >
          {/* =====================================================
              DECORATIVE BACKGROUND
          ===================================================== */}

          {/* Top right circle */}
          <div
            aria-hidden
            className="
              absolute
              -right-32
              -top-32
              h-[420px]
              w-[420px]
              rounded-full
              border
              border-white/10
            "
          />

          {/* Bottom left circle */}
          <div
            aria-hidden
            className="
              absolute
              -bottom-40
              -left-32
              h-[420px]
              w-[420px]
              rounded-full
              border
              border-white/10
            "
          />

          {/* Middle circle */}
          <div
            aria-hidden
            className="
              absolute
              right-20
              top-1/2
              h-56
              w-56
              -translate-y-1/2
              rounded-full
              border
              border-white/5
            "
          />

          {/* Soft glow */}
          <div
            aria-hidden
            className="
              absolute
              left-1/2
              top-1/2
              h-72
              w-72
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-white/5
              blur-3xl
            "
          />

          {/* =====================================================
              LOGO
          ===================================================== */}
          <div
            className="
              relative
              z-10
              flex
              flex-col
              items-center
              text-center
            "
          >
            <div
              className="
                flex
                h-24
                w-24
                items-center
                justify-center
                rounded-2xl
                bg-white
                p-3
                shadow-xl
                ring-1
                ring-white/20
              "
            >
              <Image
                src="/logo.png"
                alt="Ikonex Systems"
                width={160}
                height={160}
                priority
                className="h-full w-full object-contain"
              />
            </div>

            <div className="mt-5">
              <h2
                className="
                  text-2xl
                  font-bold
                  tracking-tight
                  text-white
                "
              >
                Ikonex Systems
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  font-medium
                  uppercase
                  tracking-[0.2em]
                  text-white/60
                "
              >
                Billing & Network Operations
              </p>
            </div>
          </div>

          {/* =====================================================
              BRAND CONTENT
          ===================================================== */}
          <div
            className="
              relative
              z-10
              mx-auto
              w-full
              max-w-md
              py-6
            "
          >
            <p
              className="
                mb-4
                text-xs
                font-semibold
                uppercase
                tracking-[0.2em]
                text-white/50
              "
            >
              Network Management Platform
            </p>

            <h1
              className="
                text-4xl
                font-bold
                leading-[1.15]
                tracking-tight
                text-white
                xl:text-[46px]
              "
            >
              Manage your network with confidence.
            </h1>

            <p
              className="
                mt-5
                max-w-md
                text-base
                leading-7
                text-white/65
              "
            >
              Billing, connectivity, and network operations in one platform.
            </p>

            {/* =================================================
                TRUST INDICATORS
            ================================================= */}
            <div className="mt-7 space-y-3">
              {[
                "Real-time subscriber management",
                "M-Pesa & Airtel Money integrated",
                "MikroTik-native PPPoE support",
              ].map((item) => (
                <div
                  key={item}
                  className="
                    flex
                    items-center
                    gap-3
                    text-sm
                    text-white/80
                  "
                >
                  <span
                    className="
                      flex
                      h-5
                      w-5
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-white/10
                      ring-1
                      ring-white/10
                    "
                  >
                    <span
                      className="
                        h-1.5
                        w-1.5
                        rounded-full
                        bg-white
                      "
                    />
                  </span>

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* =====================================================
              FOOTER
          ===================================================== */}
          <p
            className="
              relative
              z-10
              text-xs
              text-white/40
            "
          >
            © {new Date().getFullYear()} Ikonex Systems. All rights reserved.
          </p>
        </aside>

        {/* =======================================================
            LOGIN / FORM PANEL
        ======================================================= */}
        <main
          className="
            flex
            flex-1
            items-center
            justify-center
            bg-background
            p-5
            sm:p-8
            lg:p-12
            xl:p-16
          "
        >
          <div className="w-full max-w-md">
            {/* =================================================
                MOBILE LOGO
            ================================================= */}
            <div
              className="
                mb-7
                flex
                flex-col
                items-center
                text-center
                lg:hidden
              "
            >
              <div
                className="
                  flex
                  h-20
                  w-20
                  items-center
                  justify-center
                  rounded-2xl
                  bg-white
                  p-2.5
                  shadow-lg
                  ring-1
                  ring-border
                "
              >
                <Image
                  src="/logo.png"
                  alt="Ikonex Systems"
                  width={140}
                  height={140}
                  priority
                  className="h-full w-full object-contain"
                />
              </div>

              <h2
                className="
                  mt-4
                  text-xl
                  font-bold
                  tracking-tight
                "
              >
                Ikonex Systems
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  font-medium
                  uppercase
                  tracking-[0.18em]
                  text-muted-foreground
                "
              >
                Billing & Network Operations
              </p>
            </div>

            {/* =================================================
                LOGIN CARD
            ================================================= */}
            <div
              className="
                rounded-3xl
                border
                border-border/70
                bg-card
                p-6
                shadow-[0_20px_70px_rgba(0,0,0,0.08)]
                sm:p-8
              "
            >
              {children}
            </div>

            {/* =================================================
                SECURITY FOOTER
            ================================================= */}
            <p
              className="
                mt-5
                text-center
                text-xs
                text-muted-foreground
              "
            >
              Secure access to your ISP management platform
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}