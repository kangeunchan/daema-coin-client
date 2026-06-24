import { Badge } from "@daema/ui/badge";
import { Button } from "@daema/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@daema/ui/card";
import { Text } from "@daema/ui/text";

export function App() {
  return (
    <main className="app">
      <Card asChild className="seller-shell" padding="lg">
        <section aria-label="Seller app scaffold">
          <CardHeader>
            <Badge intent="success">Seller</Badge>
            <CardTitle>Seller App</CardTitle>
            <CardDescription>셀러 운영 화면을 위한 표준 UI shell입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Text color="muted">
              디자인 토큰과 공용 primitive를 기준으로 판매자 워크플로를 확장합니다.
            </Text>
            <div className="seller-shell__actions">
              <Button>상품 관리</Button>
              <Button intent="secondary">정산 보기</Button>
            </div>
          </CardContent>
        </section>
      </Card>
    </main>
  );
}
