
import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export function BrazilFlag({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 900 630"
      className={cn("h-4 w-auto rounded-sm", className)}
      {...props}
    >
      <rect width="900" height="630" fill="#009c3b" />
      <path d="M450 63L63 315l387 252L837 315 450 63z" fill="#ffdf00" />
      <circle cx="450" cy="315" r="147" fill="#002776" />
    </svg>
  );
}

export function USFlag({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1235 650"
      className={cn("h-4 w-auto rounded-sm", className)}
      {...props}
    >
      <rect width="1235" height="650" fill="#FFF" />
      <path
        fill="#B22234"
        d="M0 0h1235v650H0z"
      />
      <path
        fill="#FFF"
        d="M0 50h1235v50H0zm0 100h1235v50H0zm0 100h1235v50H0zm0 100h1235v50H0zm0 100h1235v50H0zm0 100h1235v50H0z"
      />
      <path
        fill="#3C3B6E"
        d="M0 0h494v350H0z"
      />
      <g fill="#FFF">
        {[...Array(5)].map((_, i) =>
          [...Array(6)].map((_, j) => (
            <path
              key={`${i}-${j}`}
              d={`M${49.4 * (j + 1) - 24.7} ${35 * (i + 1) - 17.5}l5.878 18.09 15.3-11.18-15.3-11.18L${49.4 * (j + 1) - 24.7 - 5.878} ${35 * (i + 1) - 17.5 - 18.09}l-5.878 18.09-15.3 11.18 15.3 11.18-5.878 18.09z`}
            />
          ))
        )}
        {[...Array(4)].map((_, i) =>
          [...Array(5)].map((_, j) => (
            <path
              key={`row2-${i}-${j}`}
              d={`M${49.4 * (j + 1)} ${35 * (i + 1)}l5.878 18.09 15.3-11.18-15.3-11.18-5.878-18.09-5.878 18.09-15.3 11.18 15.3 11.18-5.878 18.09z`}
            />
          ))
        )}
      </g>
    </svg>
  );
}

export function SpainFlag({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 750 500"
      className={cn("h-4 w-auto rounded-sm", className)}
      {...props}
    >
      <rect width="750" height="500" fill="#c60b1e" />
      <rect y="125" width="750" height="250" fill="#ffc400" />
    </svg>
  );
}
