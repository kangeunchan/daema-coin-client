import { Badge } from "@daema/ui/badge";
import { Button } from "@daema/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@daema/ui/card";
import { Text } from "@daema/ui/text";

export function App() {
  return (
    <main className="app">
      <Card asChild className="admin-shell" padding="lg">
        <section aria-label="Admin app scaffold">
          <CardHeader>
            <Badge intent="brand">Admin</Badge>
            <CardTitle>Admin App</CardTitle>
            <CardDescription>운영자 워크스페이스를 위한 표준 UI shell입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Text color="muted">
              디자인 토큰과 공용 primitive를 기준으로 화면 확장을 시작할 수 있습니다.
            </Text>
            <div className="admin-shell__actions">
              <Button>대시보드 열기</Button>
              <Button intent="secondary">권한 관리</Button>
            </div>
          </CardContent>
        </section>
      </Card>
    </main>
  );
}
