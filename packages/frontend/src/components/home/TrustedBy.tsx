"use client";

import Image from "next/image";
import styled from "styled-components";

/** Companies where Tokscale users report working (community reports, not customer relationships). */
const LOGOS = [
  { name: "Microsoft", src: "/assets/v2/trusted/microsoft.svg", width: 105, height: 23, display: 21 },
  { name: "Amazon", src: "/assets/v2/trusted/amazon.svg", width: 73, height: 24, display: 22 },
  { name: "MUSINSA", src: "/assets/v2/trusted/musinsa.svg", width: 103, height: 18, display: 15 },
  { name: "Google", src: "/assets/v2/trusted/google.svg", width: 76, height: 26, display: 23 },
  { name: "Toss", src: "/assets/v2/trusted/toss.png", width: 173, height: 52, display: 23 },
  { name: "Hashed", src: "/assets/v2/trusted/hashed.svg", width: 108, height: 28, display: 21 },
] as const;

export function TrustedBy() {
  return (
    <Wrap aria-labelledby="trusted-by-title">
      <Label id="trusted-by-title">Trusted by professionals at</Label>
      <Logos>
        {LOGOS.map((logo) => (
          <li key={logo.name}>
            <Image
              src={logo.src}
              alt={logo.name}
              height={logo.display}
              width={Math.round((logo.width * logo.display) / logo.height)}
              unoptimized
            />
          </li>
        ))}
      </Logos>
    </Wrap>
  );
}

const Wrap = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  margin-top: 40px;
  text-align: center;

  @media (max-width: 720px) {
    gap: 16px;
    margin-top: 32px;
  }
`;

const Label = styled.p`
  margin: 0;
  color: var(--v2-text-subtle);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
`;

const Logos = styled.ul`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 18px 44px;
  margin: 0;
  padding: 0;
  list-style: none;

  img {
    display: block;
    width: auto;
    opacity: 0.85;
  }

  @media (max-width: 720px) {
    display: grid;
    grid-template-columns: repeat(3, auto);
    gap: 22px 28px;
    justify-items: center;
  }
`;
