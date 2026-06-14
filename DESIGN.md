# Design

## Theme

场景是学生在晚上整理校招投递清单，旁边开着简历和岗位 JD。界面应该像一张清晰的决策桌面：明亮、安静、有行动感。

## Color

```css
:root {
  --bg: oklch(1 0 0);
  --surface: oklch(0.977 0.007 150);
  --surface-strong: oklch(0.943 0.018 150);
  --ink: oklch(0.18 0.027 155);
  --muted: oklch(0.42 0.029 155);
  --line: oklch(0.88 0.018 150);
  --primary: oklch(0.49 0.145 150);
  --primary-strong: oklch(0.37 0.13 150);
  --accent: oklch(0.62 0.145 205);
  --warning: oklch(0.68 0.14 75);
  --danger: oklch(0.58 0.16 28);
  --success: oklch(0.5 0.14 150);
}
```

## Typography

Use a single system sans stack for product clarity: `Inter`, `Segoe UI`, `PingFang SC`, `Microsoft YaHei`, `system-ui`, sans-serif. Fixed rem scale, no fluid heading sizes.

## Layout

Desktop uses a two-column app workspace: input panel on the left, analysis output on the right. Mobile stacks the panels with the action button kept near the input fields. Cards use 8px radius and solid borders, with minimal shadow only on active results.

## Components

Buttons, selects, textareas and chips share one compact control vocabulary. Result cards show score, fit reasons, risk gaps and next action. Progress bars use semantic colors and always pair color with text labels.

## Motion

Use 150-220 ms transitions for score changes, selected cards and toast feedback. Disable non-essential transitions under `prefers-reduced-motion: reduce`.
