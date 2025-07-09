import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("유효한 이메일 주소를 입력해주세요"),
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
  name: z.string().min(2, "이름은 최소 2자 이상이어야 합니다"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = validationResult.data;
    const supabase = await createClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 사용중인 이메일입니다" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        email,
        name,
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (createError) {
      console.error("User creation error:", createError);
      return NextResponse.json(
        { error: "회원가입 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    // Assign default 'user' role
    const { data: roleData } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "user")
      .single();

    if (roleData) {
      await supabase.from("user_roles").insert({
        user_id: newUser.id,
        role_id: roleData.id,
      });
    }

    return NextResponse.json(
      {
        message: "회원가입이 완료되었습니다",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "회원가입 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
