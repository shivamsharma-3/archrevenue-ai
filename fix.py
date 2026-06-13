import os

filepath = 'g:/AI-Lead/src/layouts/AppLayout.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("showToast(Deleted $ leads successfully, 'success');", "showToast(Deleted \ leads successfully, 'success');")
content = content.replace("showToast(Lead moved to $, 'success');", "showToast(Lead moved to \, 'success');")
content = content.replace("setSellerProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as SellerProfile);", "setSellerProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as unknown as SellerProfile);")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed script executed.')
