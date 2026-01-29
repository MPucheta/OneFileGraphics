export default function (path: string) {
  return `${import.meta.env.BASE_URL}/${path}`;
}