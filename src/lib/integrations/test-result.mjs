export async function updateResendTestResult(db, connection, result) {
  const updated = await db.workspaceIntegration.updateMany({
    where: {
      id: connection.id,
      status: connection.status,
      fromEmail: connection.fromEmail,
      secretCiphertext: connection.secretCiphertext,
      secretIv: connection.secretIv,
      secretTag: connection.secretTag,
    },
    data: result,
  });
  return updated.count === 1;
}
