export default function CopyrightYear({ initialYear }) {
  return initialYear ?? new Date().getFullYear();
}
