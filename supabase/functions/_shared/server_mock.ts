export function serve(handler: any) {
  console.log("Mock serve called");
  return {
    finished: Promise.resolve()
  };
}
